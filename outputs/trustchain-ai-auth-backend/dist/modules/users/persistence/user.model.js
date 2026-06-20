"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
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
    roles: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Role", required: true, index: true }],
    totpEnabled: { type: Boolean, default: false },
    totpSecretEncrypted: { type: String, select: false },
    pendingTotpSecretEncrypted: { type: String, select: false },
    lastLoginAt: Date,
    riskProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: "TrustProfile" },
    passwordResetTokenHash: { type: String, select: false, index: true },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordChangedAt: Date,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true, versionKey: false });
exports.UserModel = (0, mongoose_1.model)("User", UserSchema, "users");
