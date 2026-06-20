import type { ObjectId, RiskSeverity, TrustDecision } from "../../../shared/types/common";

export interface RiskSignal {
  name: string;
  value: unknown;
  weight: number;
  reason?: string;
}

export interface RiskEvent {
  _id: ObjectId;
  userId?: ObjectId;
  actorId?: ObjectId;
  deviceId?: ObjectId;
  eventCategory: string;
  eventType: string;
  severity: RiskSeverity;
  riskScore: number;
  trustScoreBefore?: number;
  trustScoreAfter?: number;
  signals: RiskSignal[];
  mlScore?: number;
  decision: TrustDecision;
  enforcementAction?: string;
  caseId?: ObjectId;
  createdAt: Date;
}
