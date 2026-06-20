import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { Session } from "../domain/session.types";
import { SessionModel } from "./session.model";

export class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super(SessionModel);
  }

  findActiveByRefreshJwtIdWithSecret(refreshJwtId: string) {
    return SessionModel.findOne({ refreshJwtId, status: "ACTIVE" }).select("+refreshTokenHash").exec();
  }

  findActiveByUser(userId: string) {
    return SessionModel.find({ userId, status: "ACTIVE" }).sort({ createdAt: -1 }).exec();
  }

  setAccessJwtId(sessionId: string, accessJwtId: string) {
    return SessionModel.findByIdAndUpdate(sessionId, { $set: { accessJwtId } }).exec();
  }

  rotateRefreshToken(sessionId: string, refreshJwtId: string, refreshTokenHash: string, refreshExpiresAt: Date) {
    return SessionModel.findByIdAndUpdate(sessionId, {
      $set: { refreshJwtId, refreshTokenHash, refreshExpiresAt, status: "ACTIVE" }
    }).exec();
  }

  revoke(sessionId: string, reason: string) {
    return SessionModel.findByIdAndUpdate(sessionId, {
      $set: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason }
    }).exec();
  }

  revokeByRefreshJwtId(refreshJwtId: string, reason: string) {
    return SessionModel.findOneAndUpdate({ refreshJwtId, status: "ACTIVE" }, {
      $set: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason }
    }).exec();
  }

  revokeAllForUser(userId: string, reason: string) {
    return SessionModel.updateMany({ userId, status: "ACTIVE" }, {
      $set: { status: "REVOKED", revokedAt: new Date(), revokedReason: reason }
    }).exec();
  }
}
