"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MlPredictionRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const ml_prediction_model_1 = require("./ml-prediction.model");
class MlPredictionRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(ml_prediction_model_1.MlPredictionModel);
    }
    findRecentByUser(userId, limit = 10) {
        return ml_prediction_model_1.MlPredictionModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
    }
    findRecentAnomaliesByUser(userId, since, limit = 25) {
        return ml_prediction_model_1.MlPredictionModel.find({ userId, isAnomaly: true, createdAt: { $gte: since } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
}
exports.MlPredictionRepository = MlPredictionRepository;
