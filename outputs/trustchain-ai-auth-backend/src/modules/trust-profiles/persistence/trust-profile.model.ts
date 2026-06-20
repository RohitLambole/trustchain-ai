import { model, Schema } from "mongoose";
import type { TrustProfile } from "../domain/trust-profile.types";

const TrustProfileSchema = new Schema<TrustProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentTrustScore: { type: Number, min: 0, max: 100, default: 70, index: true },
    baselineBehavior: { type: Schema.Types.Mixed, default: {} },
    knownDevices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
    knownLocations: [{ country: String, region: String, city: String }],
    riskFlags: [{ type: String, index: true }],
    scoreHistory: [
      {
        score: { type: Number, min: 0, max: 100 },
        reason: String,
        eventId: { type: Schema.Types.ObjectId },
        at: { type: Date, default: Date.now }
      }
    ],
    lastCalculatedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true, versionKey: false }
);

export const TrustProfileModel = model<TrustProfile>("TrustProfile", TrustProfileSchema, "trust_profiles");
