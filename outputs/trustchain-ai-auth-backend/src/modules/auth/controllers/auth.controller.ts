import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

function contextFrom(req: Request) {
  return {
    ipAddress: req.ip ?? req.socket.remoteAddress ?? "0.0.0.0",
    userAgent: req.get("user-agent")
  };
}

export class AuthController {
  register(req: Request, res: Response, next: NextFunction) {
    authService.register(req.body).then((result) => res.status(201).json(result)).catch(next);
  }

  login(req: Request, res: Response, next: NextFunction) {
    authService.login(req.body, contextFrom(req)).then((result) => res.status(200).json(result)).catch(next);
  }

  refresh(req: Request, res: Response, next: NextFunction) {
    authService.refresh(req.body).then((result) => res.status(200).json(result)).catch(next);
  }

  enrollTotp(req: Request, res: Response, next: NextFunction) {
    authService.enrollTotp(req.auth!.sub).then((result) => res.status(200).json(result)).catch(next);
  }

  verifyTotp(req: Request, res: Response, next: NextFunction) {
    authService.verifyTotp(req.auth!.sub, req.body).then((result) => res.status(200).json(result)).catch(next);
  }

  logout(req: Request, res: Response, next: NextFunction) {
    authService.logout(req.auth!.sub, req.auth!.sessionId, req.body).then((result) => res.status(200).json(result)).catch(next);
  }

  requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    authService.requestPasswordReset(req.body).then((result) => res.status(202).json(result)).catch(next);
  }

  confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
    authService.confirmPasswordReset(req.body).then((result) => res.status(200).json(result)).catch(next);
  }
}
