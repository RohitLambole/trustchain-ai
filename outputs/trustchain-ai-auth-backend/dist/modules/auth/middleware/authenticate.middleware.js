"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const session_repository_1 = require("../../sessions/persistence/session.repository");
const jwt_service_1 = require("../services/jwt.service");
const jwtService = new jwt_service_1.JwtService();
const sessions = new session_repository_1.SessionRepository();
const authenticate = async (req, _res, next) => {
    try {
        const header = req.headers.authorization;
        const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
        if (!token) {
            throw new app_error_1.UnauthorizedError();
        }
        const claims = jwtService.verifyAccessToken(token);
        const session = await sessions.findById(claims.sessionId);
        if (!session || session.status !== "ACTIVE" || session.accessJwtId !== claims.jti || session.expiresAt.getTime() <= Date.now()) {
            throw new app_error_1.UnauthorizedError("Invalid or expired session");
        }
        req.auth = claims;
        next();
    }
    catch (error) {
        next(error instanceof app_error_1.UnauthorizedError ? error : new app_error_1.UnauthorizedError("Invalid access token"));
    }
};
exports.authenticate = authenticate;
