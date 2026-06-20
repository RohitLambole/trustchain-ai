import type { GeoLocation, ObjectId } from "../../../shared/types/common";

export type AuthMethod = "PASSWORD" | "PASSWORD_TOTP" | "SSO" | "RECOVERY";
export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "BLOCKED";

export interface Session {
  _id: ObjectId;
  userId: ObjectId;
  accessJwtId?: string;
  refreshJwtId: string;
  refreshTokenHash: string;
  deviceId?: ObjectId;
  ipAddress: string;
  geoLocation?: GeoLocation;
  userAgent?: string;
  authMethod: AuthMethod;
  riskScore: number;
  trustScore: number;
  status: SessionStatus;
  expiresAt: Date;
  refreshExpiresAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
