import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { Device } from "../domain/device.types";
import { DeviceModel } from "./device.model";

export class DeviceRepository extends BaseRepository<Device> {
  constructor() {
    super(DeviceModel);
  }

  findByUser(userId: string) {
    return DeviceModel.find({ userId }).sort({ lastSeenAt: -1 }).exec();
  }

  findByUserAndFingerprint(userId: string, fingerprintHash: string) {
    return DeviceModel.findOne({ userId, fingerprintHash }).exec();
  }

  touch(deviceId: string, ipAddress: string, userAgent: string) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $set: { lastSeenAt: new Date(), lastIpAddress: ipAddress, userAgent }
    }, { new: true }).exec();
  }

  incrementSuccessfulLogin(deviceId: string, totpSuccess: boolean) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $inc: { successfulLoginCount: 1, totpSuccessCount: totpSuccess ? 1 : 0 },
      $set: { lastSeenAt: new Date() }
    }, { new: true }).exec();
  }

  incrementFailedLogin(deviceId: string) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $inc: { failedLoginCount: 1 },
      $set: { lastSeenAt: new Date() }
    }, { new: true }).exec();
  }

  incrementRecoveryAttempt(deviceId: string) {
    return DeviceModel.findByIdAndUpdate(deviceId, { $inc: { recoveryAttemptCount: 1 } }, { new: true }).exec();
  }

  incrementSuspiciousActivity(deviceId: string, flag: string) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $inc: { suspiciousActivityCount: 1 },
      $addToSet: { riskFlags: flag }
    }, { new: true }).exec();
  }

  updateTrust(deviceId: string, trustScore: number, trustLevel: Device["trustLevel"]) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $set: { trustScore, trustLevel, trusted: trustLevel === "TRUSTED" }
    }, { new: true }).exec();
  }

  block(deviceId: string, reason: string) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $set: {
        trustScore: 0,
        trustLevel: "BLOCKED",
        trusted: false,
        blockedAt: new Date(),
        blockedReason: reason
      },
      $addToSet: { riskFlags: "BLOCKED" }
    }, { new: true }).exec();
  }

  unblock(deviceId: string) {
    return DeviceModel.findByIdAndUpdate(deviceId, {
      $set: { trustLevel: "UNKNOWN", trustScore: 45, trusted: false },
      $unset: { blockedAt: "", blockedReason: "" },
      $pull: { riskFlags: "BLOCKED" }
    }, { new: true }).exec();
  }
}
