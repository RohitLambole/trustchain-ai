"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskPolicyModel = void 0;
const mongoose_1 = require("mongoose");
const RiskPolicyConditionSchema = new mongoose_1.Schema({
    field: { type: String, required: true },
    operator: { type: String, enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains"], required: true },
    value: { type: mongoose_1.Schema.Types.Mixed, required: true }
}, { _id: false });
const RiskPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    enabled: { type: Boolean, default: true, index: true },
    conditions: [RiskPolicyConditionSchema],
    action: { type: String, required: true, index: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
    priority: { type: Number, default: 100, index: true },
    weight: { type: Number, default: 0 },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true, versionKey: false });
RiskPolicySchema.index({ enabled: 1, priority: 1 });
exports.RiskPolicyModel = (0, mongoose_1.model)("RiskPolicy", RiskPolicySchema, "risk_policies");
