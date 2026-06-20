"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../../../config/env");
class JwtService {
    createTokenPair(input) {
        const accessJwtId = (0, uuid_1.v4)();
        const refreshJwtId = (0, uuid_1.v4)();
        const now = Date.now();
        const accessTokenExpiresAt = new Date(now + env_1.env.ACCESS_TOKEN_TTL_SECONDS * 1000);
        const refreshTokenExpiresAt = new Date(now + env_1.env.REFRESH_TOKEN_TTL_SECONDS * 1000);
        const accessClaims = {
            sub: input.sub,
            email: input.email,
            roles: input.roles,
            permissions: input.permissions,
            sessionId: input.sessionId,
            authLevel: input.authLevel,
            trustScore: input.trustScore,
            jti: accessJwtId,
            tokenUse: "access"
        };
        const refreshClaims = {
            sub: input.sub,
            sessionId: input.sessionId,
            jti: refreshJwtId,
            tokenUse: "refresh"
        };
        return {
            accessJwtId,
            refreshJwtId,
            accessToken: jsonwebtoken_1.default.sign(accessClaims, env_1.env.JWT_ACCESS_SECRET, this.signOptions(env_1.env.ACCESS_TOKEN_TTL_SECONDS)),
            refreshToken: jsonwebtoken_1.default.sign(refreshClaims, env_1.env.JWT_REFRESH_SECRET, this.signOptions(env_1.env.REFRESH_TOKEN_TTL_SECONDS)),
            accessTokenExpiresAt,
            refreshTokenExpiresAt
        };
    }
    verifyAccessToken(token) {
        const claims = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, this.verifyOptions());
        if (claims.tokenUse !== "access") {
            throw new Error("Invalid token use");
        }
        return claims;
    }
    verifyRefreshToken(token) {
        const claims = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET, this.verifyOptions());
        if (claims.tokenUse !== "refresh") {
            throw new Error("Invalid token use");
        }
        return claims;
    }
    signOptions(expiresIn) {
        return {
            issuer: env_1.env.JWT_ISSUER,
            audience: env_1.env.JWT_AUDIENCE,
            expiresIn
        };
    }
    verifyOptions() {
        return {
            issuer: env_1.env.JWT_ISSUER,
            audience: env_1.env.JWT_AUDIENCE
        };
    }
}
exports.JwtService = JwtService;
