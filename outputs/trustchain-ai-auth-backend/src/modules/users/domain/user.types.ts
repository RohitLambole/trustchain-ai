import type { ObjectId } from "../../../shared/types/common";

export type UserStatus = "ACTIVE" | "LOCKED" | "SUSPENDED" | "PENDING_KYC" | "CLOSED";
export type KycStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "REVIEW_REQUIRED";

export interface User {
  _id: ObjectId;
  customerId?: string;
  employeeId?: string;
  email: string;
  phone?: string;
  passwordHash: string;
  status: UserStatus;
  kycStatus: KycStatus;
  roles: ObjectId[];
  totpEnabled: boolean;
  totpSecretEncrypted?: string;
  pendingTotpSecretEncrypted?: string;
  lastLoginAt?: Date;
  riskProfileId?: ObjectId;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  passwordChangedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
