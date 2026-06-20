import { model, Schema } from "mongoose";
import type { Device } from "../domain/device.types";

const DeviceSchema = new Schema<Device>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fingerprintHash: { type: String, required: true, index: true },
    userAgent: { type: String, required: true },
    browser: { type: String, required: true, index: true },
    os: { type: String, required: true, index: true },
    screenResolution: String,
    timezone: String,
    language: String,
    platform: String,
    firstIpAddress: { type: String, required: true },
    lastIpAddress: { type: String, required: true, index: true },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    trustScore: { type: Number, min: 0, max: 100, default: 45, index: true },
    trustLevel: {
      type: String,
      enum: ["TRUSTED", "UNKNOWN", "SUSPICIOUS", "BLOCKED"],
      default: "UNKNOWN",
      index: true
    },
    trusted: { type: Boolean, default: false, index: true },
    successfulLoginCount: { type: Number, min: 0, default: 0 },
    failedLoginCount: { type: Number, min: 0, default: 0 },
    totpSuccessCount: { type: Number, min: 0, default: 0 },
    recoveryAttemptCount: { type: Number, min: 0, default: 0 },
    suspiciousActivityCount: { type: Number, min: 0, default: 0 },
    riskFlags: [{ type: String, index: true }],
    fraudFlags: [{ type: String, index: true }],
    blockedAt: Date,
    blockedReason: String
  },
  { timestamps: true, versionKey: false }
);

DeviceSchema.index({ userId: 1, fingerprintHash: 1 }, { unique: true });
DeviceSchema.index({ userId: 1, trustLevel: 1 });
DeviceSchema.index({ userId: 1, lastSeenAt: -1 });

export const DeviceModel = model<Device>("Device", DeviceSchema, "devices");
