import type { ObjectId } from "../../../shared/types/common";

export type AuditIntegrityStatus = "PENDING" | "ANCHORED" | "VERIFIED" | "FAILED";

export interface AuditLog {
  _id: ObjectId;
  auditId: string;
  actorId?: ObjectId;
  subjectId?: ObjectId;
  action: string;
  resource: string;
  eventType: string;
  riskLevel?: string;
  payloadHash: string;
  blockchainTxHash?: string;
  blockNumber?: number;
  integrityStatus: AuditIntegrityStatus;
  failureReason?: string;
  createdAt: Date;
}
