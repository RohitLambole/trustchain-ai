import type { RiskSeverity } from "../../../shared/types/common";
import type { Device } from "../../devices/domain/device.types";
import type { Session } from "../../sessions/domain/session.types";
import type { TrustProfile } from "../../trust-profiles/domain/trust-profile.types";
import type { User } from "../../users/domain/user.types";

export type MlRiskKind = "login" | "recovery" | "insider";

export interface MlPredictionResponse {
  anomaly_score: number;
  is_anomaly: boolean;
  risk_level: RiskSeverity;
  explanation: string[];
  model_name: string;
  model_version: string;
}

export interface MlPredictionResult {
  available: boolean;
  kind: MlRiskKind;
  features: Record<string, number>;
  response?: MlPredictionResponse;
  error?: string;
}

export interface MlFeatureContext {
  user: User;
  session?: Session;
  device?: Device;
  trustProfile?: TrustProfile | null;
  eventType: string;
  eventCategory: string;
  context?: Record<string, unknown>;
}
