import { SessionRepository } from "../../sessions/persistence/session.repository";
import type { AuthMethod } from "../../sessions/domain/session.types";
import { sha256 } from "../../../shared/security/crypto.service";

export interface CreateSessionInput {
  sessionId: string;
  userId: string;
  refreshJwtId: string;
  refreshToken: string;
  ipAddress: string;
  userAgent?: string;
  authMethod: AuthMethod;
  riskScore: number;
  trustScore: number;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export class SessionService {
  constructor(private readonly sessions = new SessionRepository()) {}

  async create(input: CreateSessionInput) {
    return this.sessions.create({
      _id: input.sessionId as never,
      userId: input.userId as never,
      refreshJwtId: input.refreshJwtId,
      refreshTokenHash: sha256(input.refreshToken),
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

  setAccessJwtId(sessionId: string, accessJwtId: string) {
    return this.sessions.setAccessJwtId(sessionId, accessJwtId);
  }

  revoke(sessionId: string, reason: string) {
    return this.sessions.revoke(sessionId, reason);
  }

  revokeAllForUser(userId: string, reason: string) {
    return this.sessions.revokeAllForUser(userId, reason);
  }
}
