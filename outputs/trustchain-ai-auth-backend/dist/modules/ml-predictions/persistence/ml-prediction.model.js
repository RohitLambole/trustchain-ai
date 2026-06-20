"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MlPredictionModel = void 0;
const mongoose_1 = require("mongoose");
const MlPredictionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true },
    eventId: { type: mongoose_1.Schema.Types.ObjectId, index: true },
    modelName: { type: String, required: true, index: true },
    modelVersion: { type: String, required: true, index: true },
    features: { type: mongoose_1.Schema.Types.Mixed, required: true },
    anomalyScore: { type: Number, min: 0, max: 1, required: true, index: true },
    isAnomaly: { type: Boolean, required: true, index: true }
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
MlPredictionSchema.index({ userId: 1, createdAt: -1 });
MlPredictionSchema.index({ eventId: 1 });
MlPredictionSchema.index({ modelName: 1, modelVersion: 1 });
MlPredictionSchema.index({ isAnomaly: 1, createdAt: -1 });
exports.MlPredictionModel = (0, mongoose_1.model)("MlPrediction", MlPredictionSchema, "ml_predictions");
