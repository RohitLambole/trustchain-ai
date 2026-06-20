import type { Types } from "mongoose";

export type ObjectId = Types.ObjectId;

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TrustDecision =
  | "ALLOW"
  | "ALLOW_MONITOR"
  | "STEP_UP_TOTP"
  | "BLOCK"
  | "DENY"
  | "LOCK_ACCOUNT"
  | "CREATE_CASE";

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
}
