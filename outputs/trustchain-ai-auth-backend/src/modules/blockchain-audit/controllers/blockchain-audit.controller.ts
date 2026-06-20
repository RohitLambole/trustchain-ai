import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../../shared/errors/app-error";
import { BlockchainAuditService } from "../services/blockchain-audit.service";

export class BlockchainAuditController {
  private blockchainAuditService?: BlockchainAuditService;

  list(req: Request, res: Response, next: NextFunction) {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);

    this.service()
      .listAuditIds(limit, offset)
      .then((auditIds) => res.status(200).json({ auditIds, limit, offset }))
      .catch(next);
  }

  getById(req: Request, res: Response, next: NextFunction) {
    const { auditId } = req.params;
    if (!auditId) return next(new NotFoundError("Audit record not found"));

    this.service()
      .getAudit(auditId)
      .then((audit) => res.status(200).json({ audit }))
      .catch(next);
  }

  verify(req: Request, res: Response, next: NextFunction) {
    this.service()
      .verifyAudit(req.body.auditId, req.body.eventHash)
      .then((verified) => res.status(200).json({ verified }))
      .catch(next);
  }

  private service() {
    this.blockchainAuditService ??= new BlockchainAuditService();
    return this.blockchainAuditService;
  }
}
