import { model, Schema } from "mongoose";
import type { RiskEvent } from "../domain/risk-event.types";

const RiskSignalSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    weight: { type: Number, required: true },
    reason: String
  },
  { _id: false }
);

const RiskEventSchema = new Schema<RiskEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", index: true },
    eventCategory: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    trustScoreBefore: { type: Number, min: 0, max: 100 },
    trustScoreAfter: { type: Number, min: 0, max: 100 },
    signals: [RiskSignalSchema],
    mlScore: { type: Number, min: 0, max: 1 },
    decision: { type: String, required: true, index: true },
    enforcementAction: String,
    caseId: { type: Schema.Types.ObjectId, ref: "Case", index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

RiskEventSchema.index({ userId: 1, createdAt: -1 });
RiskEventSchema.index({ deviceId: 1, createdAt: -1 });
RiskEventSchema.index({ severity: 1, createdAt: -1 });

export const RiskEventModel = model<RiskEvent>("RiskEvent", RiskEventSchema, "risk_events");
