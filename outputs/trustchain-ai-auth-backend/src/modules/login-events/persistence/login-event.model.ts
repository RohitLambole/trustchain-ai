import { model, Schema } from "mongoose";
import type { LoginEvent } from "../domain/login-event.types";

const LoginEventSchema = new Schema<LoginEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", index: true },
    eventType: {
      type: String,
      enum: ["LOGIN_SUCCESS", "LOGIN_FAILURE", "TOTP_REQUIRED", "TOTP_SUCCESS", "TOTP_FAILURE"],
      required: true,
      index: true
    },
    success: { type: Boolean, required: true, index: true },
    failureReason: String,
    ipAddress: { type: String, required: true, index: true },
    geoLocation: {
      country: String,
      region: String,
      city: String,
      lat: Number,
      lon: Number
    },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    trustScore: { type: Number, min: 0, max: 100, required: true },
    decision: { type: String, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

LoginEventSchema.index({ userId: 1, createdAt: -1 });
LoginEventSchema.index({ eventType: 1, createdAt: -1 });

export const LoginEventModel = model<LoginEvent>("LoginEvent", LoginEventSchema, "login_events");
