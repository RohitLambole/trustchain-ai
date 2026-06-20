import type { RiskSeverity } from "../../../shared/types/common";

export type BlockchainAuditEventType =
  | "HIGH_RISK_LOGIN_DECISION"
  | "ACCOUNT_LOCK_EVENT"
  | "ACCOUNT_RECOVERY_APPROVAL"
  | "PRIVILEGED_ACCESS_CHANGE"
  | "INSIDER_THREAT_ALERT"
  | "KYC_DECISION"
  | "RISK_ENGINE_FINAL_DECISION";

export interface BlockchainAuditPayload {
  auditId: string;
  userId: string;
  eventType: BlockchainAuditEventType;
  riskLevel: RiskSeverity;
  eventHash: string;
}

export interface BlockchainAuditRecord {
  auditId: string;
  userId: string;
  eventType: string;
  riskLevel: RiskSeverity;
  eventHash: string;
  timestamp: string;
  writer: string;
}
