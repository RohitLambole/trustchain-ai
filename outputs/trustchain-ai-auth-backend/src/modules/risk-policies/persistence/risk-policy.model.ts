import { model, Schema } from "mongoose";
import type { RiskPolicy } from "../domain/risk-policy.types";

const RiskPolicyConditionSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"], required: true },
    value: { type: Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const RiskPolicySchema = new Schema<RiskPolicy>(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    enabled: { type: Boolean, default: true, index: true },
    conditions: [RiskPolicyConditionSchema],
    action: { type: String, required: true, index: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
    priority: { type: Number, default: 100, index: true },
    weight: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, versionKey: false }
);

RiskPolicySchema.index({ enabled: 1, priority: 1 });

export const RiskPolicyModel = model<RiskPolicy>("RiskPolicy", RiskPolicySchema, "risk_policies");
