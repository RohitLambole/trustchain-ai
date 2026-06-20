import { z } from "zod";

const bytes32Schema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const VerifyBlockchainAuditDtoSchema = z.object({
  auditId: bytes32Schema,
  eventHash: bytes32Schema
});

export const ListBlockchainAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const AuditIdParamSchema = z.object({
  auditId: bytes32Schema
});

export type VerifyBlockchainAuditDto = z.infer<typeof VerifyBlockchainAuditDtoSchema>;
