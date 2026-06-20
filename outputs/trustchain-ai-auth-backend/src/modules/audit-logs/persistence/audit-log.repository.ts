import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { AuditLog } from "../domain/audit-log.types";
import { AuditLogModel } from "./audit-log.model";

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super(AuditLogModel);
  }

  findByAuditId(auditId: string) {
    return AuditLogModel.findOne({ auditId }).exec();
  }

  list(limit = 50, skip = 0) {
    return AuditLogModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  }

  countByStatus() {
    return AuditLogModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$integrityStatus", count: { $sum: 1 } } }
    ]).exec();
  }

  upsertPending(input: Partial<AuditLog> & { auditId: string; payloadHash: string }) {
    return AuditLogModel.findOneAndUpdate(
      { auditId: input.auditId },
      {
        $setOnInsert: {
          auditId: input.auditId,
          actorId: input.actorId,
          subjectId: input.subjectId,
          action: input.action,
          resource: input.resource,
          eventType: input.eventType,
          riskLevel: input.riskLevel,
          payloadHash: input.payloadHash,
          integrityStatus: "PENDING"
        }
      },
      { upsert: true, new: true }
    ).exec();
  }

  markAnchored(auditId: string, txHash: string, blockNumber?: number) {
    return AuditLogModel.findOneAndUpdate(
      { auditId },
      { $set: { blockchainTxHash: txHash, blockNumber, integrityStatus: "ANCHORED" }, $unset: { failureReason: "" } },
      { new: true }
    ).exec();
  }

  markVerified(auditId: string) {
    return AuditLogModel.findOneAndUpdate(
      { auditId },
      { $set: { integrityStatus: "VERIFIED" }, $unset: { failureReason: "" } },
      { new: true }
    ).exec();
  }

  markFailed(auditId: string, failureReason: string) {
    return AuditLogModel.findOneAndUpdate(
      { auditId },
      { $set: { integrityStatus: "FAILED", failureReason } },
      { new: true }
    ).exec();
  }
}
