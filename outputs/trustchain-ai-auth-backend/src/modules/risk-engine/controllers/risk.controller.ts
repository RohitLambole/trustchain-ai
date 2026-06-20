import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../../shared/errors/app-error";
import { RiskEngineService } from "../services/risk-engine.service";

const riskEngineService = new RiskEngineService();

export class RiskController {
  evaluate(req: Request, res: Response, next: NextFunction) {
    riskEngineService
      .evaluateById(req.body)
      .then((result) => res.status(201).json(result))
      .catch(next);
  }

  events(req: Request, res: Response, next: NextFunction) {
    riskEngineService
      .getEvents(req.query as never)
      .then((events) => res.status(200).json({ events }))
      .catch(next);
  }

  highRiskEvents(req: Request, res: Response, next: NextFunction) {
    const limit = Number(req.query.limit ?? 50);
    riskEngineService
      .getHighRiskEvents(limit)
      .then((events) => res.status(200).json({ events }))
      .catch(next);
  }

  trustScore(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params;
    if (!userId) return next(new NotFoundError("Trust profile not found"));

    riskEngineService
      .getTrustScore(userId)
      .then((trustScore) => res.status(200).json({ trustScore }))
      .catch(next);
  }

  dashboard(_req: Request, res: Response, next: NextFunction) {
    riskEngineService
      .getDashboard()
      .then((dashboard) => res.status(200).json(dashboard))
      .catch(next);
  }
}
