"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const session_repository_1 = require("../../sessions/persistence/session.repository");
const crypto_service_1 = require("../../../shared/security/crypto.service");
class SessionService {
    sessions;
    constructor(sessions = new session_repository_1.SessionRepository()) {
        this.sessions = sessions;
    }
    async create(input) {
        return this.sessions.create({
            _id: input.sessionId,
            userId: input.userId,
            refreshJwtId: input.refreshJwtId,
            refreshTokenHash: (0, crypto_service_1.sha256)(input.refreshToken),
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            authMethod: input.authMethod,
            riskScore: input.riskScore,
            trustScore: input.trustScore,
            status: "ACTIVE",
            expiresAt: input.accessTokenExpiresAt,
            refreshExpiresAt: input.refreshTokenExpiresAt
        });
    }
    setAccessJwtId(sessionId, accessJwtId) {
        return this.sessions.setAccessJwtId(sessionId, accessJwtId);
    }
    revoke(sessionId, reason) {
        return this.sessions.revoke(sessionId, reason);
    }
    revokeAllForUser(userId, reason) {
        return this.sessions.revokeAllForUser(userId, reason);
    }
}
exports.SessionService = SessionService;
