"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const session_model_1 = require("./session.model");
class SessionRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(session_model_1.SessionModel);
    }
    findActiveByRefreshJwtIdWithSecret(refreshJwtId) {
        return session_model_1.SessionModel.findOne({ refreshJwtId, status: "ACTIVE" }).select("+refreshTokenHash").exec();
    }
    findActiveByUser(userId) {
        return session_model_1.SessionModel.find({ userId, status: "ACTIVE" }).sort({ createdAt: -1 }).exec();
    }
    setAccessJwtId(sessionId, accessJwtId) {
        return session_model_1.SessionModel.findByIdAndUpdate(sessionId, { $set: { accessJwtId } }).exec();
    }
    rotateRefreshToken(sessionId, refreshJwtId, refreshTokenHash, refreshExpiresAt) {
        return session_model_1.SessionModel.findByIdAndUpdate(sessionId, {
            $set: { refreshJwtId, refreshTokenHash, refreshExpiresAt, status: "ACTIVE" }
        }).exec();
    }
    revoke(sessionId, reason) {
        return session_model_1.SessionModel.findByIdAndUpdate(sessionId, {
            $set: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason }
        }).exec();
    }
    revokeByRefreshJwtId(refreshJwtId, reason) {
        return session_model_1.SessionModel.findOneAndUpdate({ refreshJwtId, status: "ACTIVE" }, {
            $set: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason }
        }).exec();
    }
    revokeAllForUser(userId, reason) {
        return session_model_1.SessionModel.updateMany({ userId, status: "ACTIVE" }, {
            $set: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason }
        }).exec();
    }
}
exports.SessionRepository = SessionRepository;
