import { Router } from "express";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { validateQuery } from "../../shared/middleware/validate-query.middleware";
import { authenticate } from "../auth/middleware/authenticate.middleware";
import { RiskController } from "./controllers/risk.controller";
import { EvaluateRiskDtoSchema, HighRiskEventsQuerySchema, RiskEventsQuerySchema } from "./dto/risk.dto";

const controller = new RiskController();

export const riskRouter = Router();

riskRouter.use(authenticate);
riskRouter.post("/evaluate", validateBody(EvaluateRiskDtoSchema), controller.evaluate);
riskRouter.get("/events", validateQuery(RiskEventsQuerySchema), controller.events);
riskRouter.get("/high-risk-events", validateQuery(HighRiskEventsQuerySchema), controller.highRiskEvents);
riskRouter.get("/trust-score/:userId", controller.trustScore);
riskRouter.get("/dashboard", controller.dashboard);
