import { ForbiddenError, NotFoundError } from "../../../shared/errors/app-error";
import { SessionRepository } from "../../sessions/persistence/session.repository";
import { TrustProfileModel } from "../../trust-profiles/persistence/trust-profile.model";
import type { Device, DeviceFingerprintInput, DeviceRiskSignal, DeviceTrustLevel } from "../domain/device.types";
import type { DeviceFingerprintDto } from "../dto/device.dto";
import { DeviceRepository } from "../persistence/device.repository";
import { DeviceFingerprintService } from "./device-fingerprint.service";
import { DeviceRiskService } from "./device-risk.service";

export class DeviceTrustService {
  constructor(
    private readonly devices = new DeviceRepository(),
    private readonly sessions = new SessionRepository(),
    private readonly fingerprintService = new DeviceFingerprintService(),
    private readonly riskService = new DeviceRiskService()
  ) {}

  async listUserDevices(userId: string) {
    return this.devices.findByUser(userId);
  }

  async getUserDevice(userId: string, deviceId: string) {
    const device = await this.devices.findById(deviceId);
    if (!device || device.userId.toString() !== userId) {
      throw new NotFoundError("Device not found");
    }
    return device;
  }

  async registerDevice(userId: string, dto: DeviceFingerprintDto, context: { userAgent?: string; ipAddress: string }) {
    return this.registerOrUpdateDevice(userId, {
      userAgent: dto.userAgent ?? context.userAgent ?? "unknown",
      browser: dto.browser,
      os: dto.os,
      screenResolution: dto.screenResolution,
      timezone: dto.timezone,
      language: dto.language,
      platform: dto.platform,
      ipAddress: dto.ipAddress ?? context.ipAddress
    });
  }

  async registerSuccessfulLogin(
    userId: string,
    input: Partial<DeviceFingerprintInput>,
    options: { totpSuccess: boolean; sessionId?: string }
  ) {
    const result = await this.registerOrUpdateDevice(userId, input);
    if (result.device.trustLevel === "BLOCKED") {
      throw new ForbiddenError("Login from this device is blocked");
    }

    const updated = await this.devices.incrementSuccessfulLogin(result.device._id.toString(), options.totpSuccess);
    const rescored = await this.rescoreDevice(updated ?? result.device);

    if (options.sessionId) {
      await this.sessions.updateById(options.sessionId, { $set: { deviceId: rescored._id } });
    }

    await TrustProfileModel.updateOne(
      { userId },
      { $addToSet: { knownDevices: rescored._id }, $set: { lastCalculatedAt: new Date() } }
    ).exec();

    return { ...result, device: rescored };
  }

  async registerFailedLogin(userId: string, input: Partial<DeviceFingerprintInput>) {
    const result = await this.registerOrUpdateDevice(userId, input);
    const updated = await this.devices.incrementFailedLogin(result.device._id.toString());
    const rescored = await this.rescoreDevice(updated ?? result.device);
    if (rescored.failedLoginCount >= 5) {
      await this.riskService.createDeviceRiskEvent({
        userId,
        deviceId: rescored._id.toString(),
        eventType: "DEVICE_FAILED_LOGIN_SPIKE",
        signals: ["DEVICE_REPUTATION_LOW"],
        trustScoreBefore: result.device.trustScore,
        trustScoreAfter: rescored.trustScore
      });
    }
    return rescored;
  }

  async trustDevice(userId: string, deviceId: string) {
    const device = await this.getUserDevice(userId, deviceId);
    if (device.trustLevel === "BLOCKED") {
      throw new ForbiddenError("Blocked devices must be unblocked before they can be trusted");
    }
    return this.devices.updateTrust(deviceId, 90, "TRUSTED");
  }

  async blockDevice(userId: string, deviceId: string, reason: string) {
    await this.getUserDevice(userId, deviceId);
    const device = await this.devices.block(deviceId, reason);
    if (device) {
      await this.riskService.createDeviceRiskEvent({
        userId,
        deviceId,
        eventType: "DEVICE_BLOCKED",
        signals: ["SUSPICIOUS_DEVICE", "DEVICE_REPUTATION_LOW"],
        trustScoreBefore: device.trustScore,
        trustScoreAfter: 0
      });
    }
    return device;
  }

  async unblockDevice(userId: string, deviceId: string) {
    await this.getUserDevice(userId, deviceId);
    return this.devices.unblock(deviceId);
  }

  async getDeviceTrustScore(userId: string, deviceId: string) {
    const device = await this.getUserDevice(userId, deviceId);
    return device.trustScore;
  }

  async getDeviceRiskSignals(userId: string, deviceId: string) {
    const device = await this.getUserDevice(userId, deviceId);
    return this.riskService.getDeviceRiskSignals(device);
  }

  private async registerOrUpdateDevice(userId: string, input: Partial<DeviceFingerprintInput>) {
    const fingerprint = this.fingerprintService.create(input);
    const existing = await this.devices.findByUserAndFingerprint(userId, fingerprint.fingerprintHash);

    if (!existing) {
      const device = await this.devices.create({
        userId: userId as never,
        fingerprintHash: fingerprint.fingerprintHash,
        userAgent: fingerprint.components.userAgent,
        browser: fingerprint.browser,
        os: fingerprint.os,
        screenResolution: fingerprint.components.screenResolution,
        timezone: fingerprint.components.timezone,
        language: fingerprint.components.language,
        platform: fingerprint.components.platform,
        firstIpAddress: fingerprint.components.ipAddress,
        lastIpAddress: fingerprint.components.ipAddress,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        trustScore: 45,
        trustLevel: "UNKNOWN",
        trusted: false,
        successfulLoginCount: 0,
        failedLoginCount: 0,
        totpSuccessCount: 0,
        recoveryAttemptCount: 0,
        suspiciousActivityCount: 0,
        riskFlags: ["NEW_DEVICE"],
        fraudFlags: []
      });

      await this.riskService.createDeviceRiskEvent({
        userId,
        deviceId: device._id.toString(),
        eventType: "NEW_DEVICE_DETECTED",
        signals: ["NEW_DEVICE"],
        trustScoreAfter: device.trustScore
      });

      return { device, isNew: true, signals: ["NEW_DEVICE"] as DeviceRiskSignal[] };
    }

    const mismatchSignals = this.detectMismatches(existing, fingerprint.components);
    const touched = await this.devices.touch(existing._id.toString(), fingerprint.components.ipAddress, fingerprint.components.userAgent);

    if (mismatchSignals.length > 0) {
      await this.devices.incrementSuspiciousActivity(existing._id.toString(), "DEVICE_MISMATCH");
      await this.riskService.createDeviceRiskEvent({
        userId,
        deviceId: existing._id.toString(),
        eventType: "DEVICE_MISMATCH_DETECTED",
        signals: mismatchSignals,
        trustScoreBefore: existing.trustScore
      });
    }

    return {
      device: touched ?? existing,
      isNew: false,
      signals: this.riskService.getDeviceRiskSignals(touched ?? existing, mismatchSignals)
    };
  }

  private async rescoreDevice(device: Device) {
    if (device.trustLevel === "BLOCKED") {
      return device;
    }

    const recentHighRisk = await this.riskService.recentHighRiskCount(device._id.toString());
    const score = this.calculateTrustScore(device, recentHighRisk);
    const level = this.classify(score);
    const updated = await this.devices.updateTrust(device._id.toString(), score, level);
    return updated ?? device;
  }

  private calculateTrustScore(device: Device, recentHighRiskEvents: number) {
    const ageDays = Math.max(0, Math.floor((Date.now() - device.firstSeenAt.getTime()) / 86_400_000));
    let score = 35;

    score += device.successfulLoginCount > 0 ? 15 : 0;
    score += Math.min(ageDays, 30);
    score += Math.min(device.successfulLoginCount * 4, 20);
    score += Math.min(device.totpSuccessCount * 5, 15);
    score -= Math.min(device.failedLoginCount * 8, 35);
    score -= Math.min(device.recoveryAttemptCount * 10, 30);
    score -= Math.min(device.suspiciousActivityCount * 15, 45);
    score -= Math.min(recentHighRiskEvents * 12, 36);
    score -= device.fraudFlags.length > 0 ? 40 : 0;

    return Math.max(0, Math.min(100, score));
  }

  private classify(score: number): DeviceTrustLevel {
    if (score >= 75) return "TRUSTED";
    if (score >= 45) return "UNKNOWN";
    if (score > 0) return "SUSPICIOUS";
    return "BLOCKED";
  }

  private detectMismatches(device: Device, components: Required<DeviceFingerprintInput>): DeviceRiskSignal[] {
    const mismatch =
      device.browser !== components.browser ||
      device.os !== components.os ||
      device.lastIpAddress !== components.ipAddress;

    return mismatch ? ["DEVICE_MISMATCH"] : [];
  }
}
