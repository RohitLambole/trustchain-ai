"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustProfileRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const trust_profile_model_1 = require("./trust-profile.model");
class TrustProfileRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(trust_profile_model_1.TrustProfileModel);
    }
    findByUserId(userId) {
        return trust_profile_model_1.TrustProfileModel.findOne({ userId }).exec();
    }
    createDefault(userId) {
        return trust_profile_model_1.TrustProfileModel.create({
            userId,
            currentTrustScore: 70,
            baselineBehavior: {},
            knownDevices: [],
            knownLocations: [],
            riskFlags: [],
            scoreHistory: [{ score: 70, reason: "USER_REGISTERED", at: new Date() }],
            lastCalculatedAt: new Date()
        });
    }
    updateTrustScore(userId, score, reason, eventId) {
        return trust_profile_model_1.TrustProfileModel.findOneAndUpdate({ userId }, {
            $set: { currentTrustScore: score, lastCalculatedAt: new Date() },
            $push: {
                scoreHistory: {
                    score,
                    reason,
                    eventId,
                    at: new Date()
                }
            }
        }, { new: true, upsert: true }).exec();
    }
}
exports.TrustProfileRepository = TrustProfileRepository;
