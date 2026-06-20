import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { MlPrediction } from "../domain/ml-prediction.types";
import { MlPredictionModel } from "./ml-prediction.model";

export class MlPredictionRepository extends BaseRepository<MlPrediction> {
  constructor() {
    super(MlPredictionModel);
  }

  findRecentByUser(userId: string, limit = 10) {
    return MlPredictionModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  findRecentAnomaliesByUser(userId: string, since: Date, limit = 25) {
    return MlPredictionModel.find({ userId, isAnomaly: true, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  countRecentAnomalies(since: Date) {
    return MlPredictionModel.countDocuments({ isAnomaly: true, createdAt: { $gte: since } }).exec();
  }

  findRecentAnomalies(limit = 10) {
    return MlPredictionModel.find({ isAnomaly: true }).sort({ createdAt: -1 }).limit(limit).exec();
  }
}
