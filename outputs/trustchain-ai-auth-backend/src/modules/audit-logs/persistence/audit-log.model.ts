import { model, Schema } from "mongoose";
import type { AuditLog } from "../domain/audit-log.types";

const AuditLogSchema = new Schema<AuditLog>(
  {
    auditId: { type: String, required: true, unique: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    riskLevel: { type: String, index: true },
    payloadHash: { type: String, required: true, index: true },
    blockchainTxHash: { type: String, sparse: true, index: true },
    blockNumber: Number,
    integrityStatus: {
      type: String,
      enum: ["PENDING", "ANCHORED", "VERIFIED", "FAILED"],
      default: "PENDING",
      index: true
    },
    failureReason: String
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

AuditLogSchema.index({ eventType: 1, createdAt: -1 });
AuditLogSchema.index({ integrityStatus: 1, createdAt: -1 });

export const AuditLogModel = model<AuditLog>("AuditLog", AuditLogSchema, "audit_logs");
