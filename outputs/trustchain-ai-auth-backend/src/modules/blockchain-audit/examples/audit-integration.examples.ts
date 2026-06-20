import { id } from "ethers";
import type { RiskDecision } from "../../risk-engine/domain/risk-engine.types";
import { BlockchainAuditService } from "../services/blockchain-audit.service";
import { createAuditEventHash } from "../utils/audit-hash.util";

const blockchainAuditService = new BlockchainAuditService();

export async function anchorRiskEngineDecision(input: {
  riskEventId: string;
  userId: string;
  decision: RiskDecision;
}) {
  const payload = {
    riskEventId: input.riskEventId,
    userRef: input.userId,
    decision: input.decision.decision,
    riskScore: input.decision.riskScore,
    trustScore: input.decision.trustScore,
    severity: input.decision.severity,
    enforcementActions: input.decision.enforcementActions
  };

  return blockchainAuditService.recordAudit({
    auditId: id(`risk-event:${input.riskEventId}`),
    userId: id(`user:${input.userId}`),
    eventType: "RISK_ENGINE_FINAL_DECISION",
    riskLevel: input.decision.severity,
    eventHash: createAuditEventHash(payload)
  });
}

export async function anchorAccountLockEvent(input: {
  auditReferenceId: string;
  userId: string;
  reasonCode: string;
  actorRef?: string;
}) {
  const payload = {
    auditReferenceId: input.auditReferenceId,
    userRef: input.userId,
    reasonCode: input.reasonCode,
    actorRef: input.actorRef
  };

  return blockchainAuditService.recordAudit({
    auditId: id(`account-lock:${input.auditReferenceId}`),
    userId: id(`user:${input.userId}`),
    eventType: "ACCOUNT_LOCK_EVENT",
    riskLevel: "CRITICAL",
    eventHash: createAuditEventHash(payload)
  });
}

export async function anchorKycDecision(input: {
  kycRecordId: string;
  userId: string;
  decision: "APPROVED" | "REJECTED";
  reviewerRef: string;
}) {
  const payload = {
    kycRecordId: input.kycRecordId,
    userRef: input.userId,
    decision: input.decision,
    reviewerRef: input.reviewerRef
  };

  return blockchainAuditService.recordAudit({
    auditId: id(`kyc:${input.kycRecordId}:${input.decision}`),
    userId: id(`user:${input.userId}`),
    eventType: "KYC_DECISION",
    riskLevel: input.decision === "REJECTED" ? "HIGH" : "MEDIUM",
    eventHash: createAuditEventHash(payload)
  });
}
