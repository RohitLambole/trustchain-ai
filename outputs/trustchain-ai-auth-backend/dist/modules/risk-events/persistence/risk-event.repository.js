"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEventRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const risk_event_model_1 = require("./risk-event.model");
class RiskEventRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(risk_event_model_1.RiskEventModel);
    }
    findRecentByDevice(deviceId, limit = 20) {
        return risk_event_model_1.RiskEventModel.find({ deviceId }).sort({ createdAt: -1 }).limit(limit).exec();
    }
    findRecentByUser(userId, limit = 25) {
        return risk_event_model_1.RiskEventModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
    }
    countRecentHighRiskByDevice(deviceId, since) {
        return risk_event_model_1.RiskEventModel.countDocuments({
            deviceId,
            severity: { $in: ["HIGH", "CRITICAL"] },
            createdAt: { $gte: since }
        }).exec();
    }
}
exports.RiskEventRepository = RiskEventRepository;
