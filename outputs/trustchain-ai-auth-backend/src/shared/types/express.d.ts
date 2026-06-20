import type { JwtAccessClaims } from "../../modules/auth/domain/jwt.types";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtAccessClaims;
    }
  }
}
