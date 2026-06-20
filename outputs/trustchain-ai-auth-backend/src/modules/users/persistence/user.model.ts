import { model, Schema } from "mongoose";
import type { User } from "../domain/user.types";

const UserSchema = new Schema<User>(
  {
    customerId: { type: String, trim: true, sparse: true, unique: true },
    employeeId: { type: String, trim: true, sparse: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    status: {
      type: String,
      enum: ["ACTIVE", "LOCKED", "SUSPENDED", "PENDING_KYC", "CLOSED"],
      default: "ACTIVE",
      index: true
    },
    kycStatus: {
      type: String,
      enum: ["NOT_STARTED", "PENDING", "APPROVED", "REJECTED", "REVIEW_REQUIRED"],
      default: "NOT_STARTED",
      index: true
    },
    roles: [{ type: Schema.Types.ObjectId, ref: "Role", required: true, index: true }],
    totpEnabled: { type: Boolean, default: false },
    totpSecretEncrypted: { type: String, select: false },
    pendingTotpSecretEncrypted: { type: String, select: false },
    lastLoginAt: Date,
    riskProfileId: { type: Schema.Types.ObjectId, ref: "TrustProfile" },
    passwordResetTokenHash: { type: String, select: false, index: true },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordChangedAt: Date,
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true, versionKey: false }
);

export const UserModel = model<User>("User", UserSchema, "users");
