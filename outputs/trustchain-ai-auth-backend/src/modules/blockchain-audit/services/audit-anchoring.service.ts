import { id } from "ethers";
import { StructuredLogger } from "../../../shared/logger/structured-logger";
import { AuditLogRepository } from "../../audit-logs/persistence/audit-log.repository";
import type { RiskDecision } from "../../risk-engine/domain/risk-engine.types";
import { BlockchainAuditService } from "./blockchain-audit.service";
import { createAuditEventHash } from "../utils/audit-hash.util";

export interface RiskDecisionAnchorInput {
  riskEventId: string;
  userId: string;
  deviceId?: string;
  eventType: string;
  eventCategory: string;
  decision: RiskDecision;
}

export class AuditAnchoringService {
  private readonly logger = new StructuredLogger("AuditAnchoringService");

  constructor(
    private readonly auditLogs = new AuditLogRepository(),
    private readonly blockchainFactory = () => new BlockchainAuditService()
  ) {}

  shouldAnchor(decision: RiskDecision) {
    return ["BLOCK", "LOCK_ACCOUNT", "CREATE_CASE"].includes(decision.decision);
  }

  async anchorRiskDecision(input: RiskDecisionAnchorInput) {
    const payload = {
      riskEventId: input.riskEventId,
      userRef: input.userId,
      deviceRef: input.deviceId,
      eventType: input.eventType,
      eventCategory: input.eventCategory,
      decision: input.decision.decision,
      severity: input.decision.severity,
      riskScore: input.decision.riskScore,
      trustScore: input.decision.trustScore,
      enforcementActions: input.decision.enforcementActions
    };

    const auditId = id(`risk-engine:${input.riskEventId}`);
    const eventHash = createAuditEventHash(payload);
    await this.auditLogs.upsertPending({
      auditId,
      subjectId: input.userId as never,
      action: input.decision.decision,
      resource: "risk_events",
      eventType: "RISK_ENGINE_FINAL_DECISION",
      riskLevel: input.decision.severity,
      payloadHash: eventHash
    });

    try {
      const blockchain = this.blockchainFactory();
      const receipt = await blockchain.recordAudit({
        auditId,
        userId: id(`user:${input.userId}`),
        eventType: "RISK_ENGINE_FINAL_DECISION",
        riskLevel: input.decision.severity,
        eventHash
      });

      await this.auditLogs.markAnchored(auditId, receipt.transactionHash, receipt.blockNumber);
      const verified = await blockchain.verifyAudit(auditId, eventHash);
      const auditLog = verified ? await this.auditLogs.markVerified(auditId) : await this.auditLogs.markFailed(auditId, "On-chain hash verification failed");

      this.logger.info("risk_decision_audit_anchored", {
        auditId,
        riskEventId: input.riskEventId,
        transactionHash: receipt.transactionHash,
        verified
      });

      return { auditId, eventHash, transactionHash: receipt.transactionHash, blockNumber: receipt.blockNumber, verified, auditLog };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown blockchain anchoring error";
      const auditLog = await this.auditLogs.markFailed(auditId, message);
      this.logger.warn("risk_decision_audit_anchor_failed", { auditId, riskEventId: input.riskEventId, error: message });
      return { auditId, eventHash, verified: false, error: message, auditLog };
    }
  }
}
