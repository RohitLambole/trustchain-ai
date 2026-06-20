import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../../../config/env";
import type { JwtAccessClaims, JwtRefreshClaims, TokenPair } from "../domain/jwt.types";

export class JwtService {
  createTokenPair(input: Omit<JwtAccessClaims, "jti" | "tokenUse"> & Omit<JwtRefreshClaims, "jti" | "tokenUse" | "sub" | "sessionId">): TokenPair & { accessJwtId: string; refreshJwtId: string } {
    const accessJwtId = uuid();
    const refreshJwtId = uuid();
    const now = Date.now();
    const accessTokenExpiresAt = new Date(now + env.ACCESS_TOKEN_TTL_SECONDS * 1000);
    const refreshTokenExpiresAt = new Date(now + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

    const accessClaims: JwtAccessClaims = {
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

    const refreshClaims: JwtRefreshClaims = {
      sub: input.sub,
      sessionId: input.sessionId,
      jti: refreshJwtId,
      tokenUse: "refresh"
    };

    return {
      accessJwtId,
      refreshJwtId,
      accessToken: jwt.sign(accessClaims, env.JWT_ACCESS_SECRET, this.signOptions(env.ACCESS_TOKEN_TTL_SECONDS)),
      refreshToken: jwt.sign(refreshClaims, env.JWT_REFRESH_SECRET, this.signOptions(env.REFRESH_TOKEN_TTL_SECONDS)),
      accessTokenExpiresAt,
      refreshTokenExpiresAt
    };
  }

  verifyAccessToken(token: string): JwtAccessClaims {
    const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, this.verifyOptions()) as JwtAccessClaims;
    if (claims.tokenUse !== "access") {
      throw new Error("Invalid token use");
    }
    return claims;
  }

  verifyRefreshToken(token: string): JwtRefreshClaims {
    const claims = jwt.verify(token, env.JWT_REFRESH_SECRET, this.verifyOptions()) as JwtRefreshClaims;
    if (claims.tokenUse !== "refresh") {
      throw new Error("Invalid token use");
    }
    return claims;
  }

  private signOptions(expiresIn: number): jwt.SignOptions {
    return {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn
    };
  }

  private verifyOptions(): jwt.VerifyOptions {
    return {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    };
  }
}
