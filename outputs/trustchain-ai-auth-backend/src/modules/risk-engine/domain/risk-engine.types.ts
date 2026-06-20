import type { Device } from "../../devices/domain/device.types";
import type { MlPrediction } from "../../ml-predictions/domain/ml-prediction.types";
import type { RiskEvent, RiskSignal } from "../../risk-events/domain/risk-event.types";
import type { RiskPolicy } from "../../risk-policies/domain/risk-policy.types";
import type { Session } from "../../sessions/domain/session.types";
import type { TrustProfile } from "../../trust-profiles/domain/trust-profile.types";
import type { User } from "../../users/domain/user.types";
import type { RiskSeverity, TrustDecision } from "../../../shared/types/common";

export type RiskEngineDecision = "ALLOW" | "ALLOW_MONITOR" | "STEP_UP_TOTP" | "BLOCK" | "LOCK_ACCOUNT" | "CREATE_CASE";

export interface RiskEvaluationInput {
  user: User;
  session?: Session;
  device?: Device;
  trustProfile?: TrustProfile | null;
  recentRiskEvents?: RiskEvent[];
  mlPredictions?: MlPrediction[];
  eventType: string;
  eventCategory: string;
  action?: string;
  resource?: string;
  context?: Record<string, unknown>;
}

export interface TrustScoreResult {
  baseScore: number;
  finalScore: number;
  signals: RiskSignal[];
}

export interface PolicyMatch {
  policyId?: string;
  name: string;
  action: TrustDecision;
  severity: RiskSeverity;
  weight: number;
  priority: number;
  reasons: string[];
}

export interface AggregatedRisk {
  riskScore: number;
  severity: RiskSeverity;
  trustScore: number;
  signals: RiskSignal[];
  policyMatches: PolicyMatch[];
  mlAnomalyScore: number;
  explanation: string[];
}

export interface RiskDecision {
  decision: RiskEngineDecision;
  severity: RiskSeverity;
  riskScore: number;
  trustScore: number;
  enforcementActions: RiskEngineDecision[];
  reasons: string[];
}

export interface RiskEvaluationResult {
  trustScore: TrustScoreResult;
  aggregate: AggregatedRisk;
  decision: RiskDecision;
}
