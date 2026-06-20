import type { GeoLocation, ObjectId, TrustDecision } from "../../../shared/types/common";

export interface LoginEvent {
  _id: ObjectId;
  userId?: ObjectId;
  sessionId?: ObjectId;
  deviceId?: ObjectId;
  eventType: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "TOTP_REQUIRED" | "TOTP_SUCCESS" | "TOTP_FAILURE";
  success: boolean;
  failureReason?: string;
  ipAddress: string;
  geoLocation?: GeoLocation;
  riskScore: number;
  trustScore: number;
  decision: TrustDecision;
  createdAt: Date;
}
