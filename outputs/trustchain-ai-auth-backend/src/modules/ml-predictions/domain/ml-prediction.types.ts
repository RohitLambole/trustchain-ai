import type { ObjectId } from "../../../shared/types/common";

export interface MlPrediction {
  _id: ObjectId;
  userId?: ObjectId;
  eventId?: ObjectId;
  modelName: string;
  modelVersion: string;
  features: Record<string, unknown>;
  anomalyScore: number;
  isAnomaly: boolean;
  createdAt: Date;
}
