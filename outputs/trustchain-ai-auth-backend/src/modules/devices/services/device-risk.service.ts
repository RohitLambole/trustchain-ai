import { RiskEventRepository } from "../../risk-events/persistence/risk-event.repository";
import type { RiskSignal } from "../../risk-events/domain/risk-event.types";
import type { Device, DeviceRiskSignal } from "../domain/device.types";

export class DeviceRiskService {
  constructor(private readonly riskEvents = new RiskEventRepository()) {}

  getDeviceRiskSignals(device: Device, mismatchSignals: DeviceRiskSignal[] = []): DeviceRiskSignal[] {
    const signals = new Set<DeviceRiskSignal>(mismatchSignals);

    if (device.successfulLoginCount === 0) signals.add("NEW_DEVICE");
    else signals.add("KNOWN_DEVICE");

    if (device.trustLevel === "SUSPICIOUS" || device.trustLevel === "BLOCKED") {
      signals.add("SUSPICIOUS_DEVICE");
    }

    if (device.trustScore < 40) {
      signals.add("DEVICE_REPUTATION_LOW");
    }

    return [...signals];
  }

  toRiskSignalDocuments(signals: DeviceRiskSignal[]): RiskSignal[] {
    const weights: Record<DeviceRiskSignal, number> = {
      NEW_DEVICE: 20,
      KNOWN_DEVICE: -10,
      SUSPICIOUS_DEVICE: 35,
      DEVICE_MISMATCH: 25,
      DEVICE_REPUTATION_LOW: 30
    };

    return signals.map((signal) => ({
      name: signal,
      value: true,
      weight: weights[signal],
      reason: this.reasonFor(signal)
    }));
  }

  async createDeviceRiskEvent(input: {
    userId: string;
    deviceId: string;
    eventType: string;
    signals: DeviceRiskSignal[];
    trustScoreBefore?: number;
    trustScoreAfter?: number;
  }) {
    const riskSignalDocs = this.toRiskSignalDocuments(input.signals);
    const riskScore = Math.max(0, Math.min(100, riskSignalDocs.reduce((total, signal) => total + signal.weight, 0) + 40));

    return this.riskEvents.create({
      userId: input.userId as never,
      deviceId: input.deviceId as never,
      eventCategory: "DEVICE",
      eventType: input.eventType,
      severity: riskScore >= 80 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW",
      riskScore,
      trustScoreBefore: input.trustScoreBefore,
      trustScoreAfter: input.trustScoreAfter,
      signals: riskSignalDocs,
      decision: riskScore >= 80 ? "DENY" : riskScore >= 60 ? "STEP_UP_TOTP" : "ALLOW_MONITOR"
    });
  }

  async recentHighRiskCount(deviceId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.riskEvents.countRecentHighRiskByDevice(deviceId, since);
  }

  private reasonFor(signal: DeviceRiskSignal) {
    switch (signal) {
      case "NEW_DEVICE":
        return "Device has not been observed for this user before";
      case "KNOWN_DEVICE":
        return "Device fingerprint already belongs to this user";
      case "SUSPICIOUS_DEVICE":
        return "Device is marked suspicious or blocked";
      case "DEVICE_MISMATCH":
        return "Observed device attributes changed from the stored profile";
      case "DEVICE_REPUTATION_LOW":
        return "Device trust score is below acceptable threshold";
    }
  }
}
