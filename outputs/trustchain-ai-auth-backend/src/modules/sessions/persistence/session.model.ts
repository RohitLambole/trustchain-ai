import { model, Schema } from "mongoose";
import type { Session } from "../domain/session.types";

const SessionSchema = new Schema<Session>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accessJwtId: { type: String, index: true },
    refreshJwtId: { type: String, required: true, unique: true },
    refreshTokenHash: { type: String, required: true, select: false },
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", index: true },
    ipAddress: { type: String, required: true, index: true },
    geoLocation: {
      country: String,
      region: String,
      city: String,
      lat: Number,
      lon: Number
    },
    userAgent: String,
    authMethod: { type: String, enum: ["PASSWORD", "PASSWORD_TOTP", "SSO", "RECOVERY"], required: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    trustScore: { type: Number, min: 0, max: 100, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "REVOKED", "BLOCKED"],
      default: "ACTIVE",
      index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    refreshExpiresAt: { type: Date, required: true, index: true },
    revokedAt: Date,
    revokedReason: String
  },
  { timestamps: true, versionKey: false }
);

SessionSchema.index({ userId: 1, status: 1 });
SessionSchema.index({ refreshExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<Session>("Session", SessionSchema, "sessions");
