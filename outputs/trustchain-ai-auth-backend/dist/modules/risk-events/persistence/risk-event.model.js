"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEventModel = void 0;
const mongoose_1 = require("mongoose");
const RiskSignalSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    value: { type: mongoose_1.Schema.Types.Mixed, required: true },
    weight: { type: Number, required: true },
    reason: String
}, { _id: false });
const RiskEventSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    deviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Device", index: true },
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
    caseId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Case", index: true }
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
RiskEventSchema.index({ userId: 1, createdAt: -1 });
RiskEventSchema.index({ deviceId: 1, createdAt: -1 });
RiskEventSchema.index({ severity: 1, createdAt: -1 });
exports.RiskEventModel = (0, mongoose_1.model)("RiskEvent", RiskEventSchema, "risk_events");
