import { Router } from "express";
import { validateBody } from "../../shared/middleware/validate.middleware";
import { validateQuery } from "../../shared/middleware/validate-query.middleware";
import { authenticate } from "../auth/middleware/authenticate.middleware";
import { BlockchainAuditController } from "./controllers/blockchain-audit.controller";
import { ListBlockchainAuditQuerySchema, VerifyBlockchainAuditDtoSchema } from "./dto/blockchain-audit.dto";

const controller = new BlockchainAuditController();

export const blockchainAuditRouter = Router();

blockchainAuditRouter.use(authenticate);
blockchainAuditRouter.get("/", validateQuery(ListBlockchainAuditQuerySchema), controller.list.bind(controller));
blockchainAuditRouter.get("/events", validateQuery(ListBlockchainAuditQuerySchema), controller.events.bind(controller));
blockchainAuditRouter.get("/verify/:auditId", controller.verifyById.bind(controller));
blockchainAuditRouter.post("/verify", validateBody(VerifyBlockchainAuditDtoSchema), controller.verify.bind(controller));
blockchainAuditRouter.get("/:auditId", controller.getById.bind(controller));
