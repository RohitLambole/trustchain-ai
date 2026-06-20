import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const EvaluateRiskDtoSchema = z.object({
  userId: objectIdSchema,
  sessionId: objectIdSchema.optional(),
  deviceId: objectIdSchema.optional(),
  eventType: z.string().min(2).max(128),
  eventCategory: z.string().min(2).max(128),
  action: z.string().min(2).max(128).optional(),
  resource: z.string().min(2).max(128).optional(),
  context: z.record(z.unknown()).optional()
});

export const RiskEventsQuerySchema = z.object({
  userId: objectIdSchema.optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  eventCategory: z.string().min(2).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0)
});

export const HighRiskEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export type EvaluateRiskDto = z.infer<typeof EvaluateRiskDtoSchema>;
export type RiskEventsQuery = z.infer<typeof RiskEventsQuerySchema>;
export type HighRiskEventsQuery = z.infer<typeof HighRiskEventsQuerySchema>;
