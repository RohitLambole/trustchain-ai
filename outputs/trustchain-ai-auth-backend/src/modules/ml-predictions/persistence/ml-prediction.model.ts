import { model, Schema } from "mongoose";
import type { MlPrediction } from "../domain/ml-prediction.types";

const MlPredictionSchema = new Schema<MlPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    eventId: { type: Schema.Types.ObjectId, index: true },
    modelName: { type: String, required: true, index: true },
    modelVersion: { type: String, required: true, index: true },
    features: { type: Schema.Types.Mixed, required: true },
    anomalyScore: { type: Number, min: 0, max: 1, required: true, index: true },
    isAnomaly: { type: Boolean, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

MlPredictionSchema.index({ userId: 1, createdAt: -1 });
MlPredictionSchema.index({ eventId: 1 });
MlPredictionSchema.index({ modelName: 1, modelVersion: 1 });
MlPredictionSchema.index({ isAnomaly: 1, createdAt: -1 });

export const MlPredictionModel = model<MlPrediction>("MlPrediction", MlPredictionSchema, "ml_predictions");
