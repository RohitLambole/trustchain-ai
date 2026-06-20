import type { ObjectId } from "../../../shared/types/common";

export type DeviceTrustLevel = "TRUSTED" | "UNKNOWN" | "SUSPICIOUS" | "BLOCKED";

export type DeviceRiskSignal =
  | "NEW_DEVICE"
  | "KNOWN_DEVICE"
  | "SUSPICIOUS_DEVICE"
  | "DEVICE_MISMATCH"
  | "DEVICE_REPUTATION_LOW";

export interface DeviceFingerprintInput {
  userAgent: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  ipAddress: string;
}

export interface DeviceFingerprint {
  fingerprintHash: string;
  browser: string;
  os: string;
  components: Required<DeviceFingerprintInput>;
}

export interface Device {
  _id: ObjectId;
  userId: ObjectId;
  fingerprintHash: string;
  userAgent: string;
  browser: string;
  os: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  firstIpAddress: string;
  lastIpAddress: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  trustScore: number;
  trustLevel: DeviceTrustLevel;
  trusted: boolean;
  successfulLoginCount: number;
  failedLoginCount: number;
  totpSuccessCount: number;
  recoveryAttemptCount: number;
  suspiciousActivityCount: number;
  riskFlags: string[];
  fraudFlags: string[];
  blockedAt?: Date;
  blockedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
