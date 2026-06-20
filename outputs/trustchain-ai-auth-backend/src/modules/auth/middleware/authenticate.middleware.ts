import type { RequestHandler } from "express";
import { UnauthorizedError } from "../../../shared/errors/app-error";
import { SessionRepository } from "../../sessions/persistence/session.repository";
import { JwtService } from "../services/jwt.service";

const jwtService = new JwtService();
const sessions = new SessionRepository();

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) {
      throw new UnauthorizedError();
    }

    const claims = jwtService.verifyAccessToken(token);
    const session = await sessions.findById(claims.sessionId);
    if (!session || session.status !== "ACTIVE" || session.accessJwtId !== claims.jti || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError("Invalid or expired session");
    }

    req.auth = claims;
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError("Invalid access token"));
  }
};
