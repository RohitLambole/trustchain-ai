import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../../shared/errors/app-error";
import { AuditLogRepository } from "../../audit-logs/persistence/audit-log.repository";
import { BlockchainAuditService } from "../services/blockchain-audit.service";

export class BlockchainAuditController {
  private blockchainAuditService?: BlockchainAuditService;
  private readonly auditLogs = new AuditLogRepository();

  events(req: Request, res: Response, next: NextFunction) {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);

    this.auditLogs
      .list(limit, offset)
      .then((events) => res.status(200).json({ events, limit, offset }))
      .catch(next);
  }

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

    Promise.all([
      this.auditLogs.findByAuditId(auditId),
      this.safeChainAudit(auditId)
    ])
      .then(([localAudit, chainAudit]) => {
        if (!localAudit && !chainAudit) throw new NotFoundError("Audit record not found");
        res.status(200).json({ audit: chainAudit, localAudit });
      })
      .catch(next);
  }

  verify(req: Request, res: Response, next: NextFunction) {
    this.service()
      .verifyAudit(req.body.auditId, req.body.eventHash)
      .then((verified) => res.status(200).json({ verified }))
      .catch(next);
  }

  verifyById(req: Request, res: Response, next: NextFunction) {
    const { auditId } = req.params;
    if (!auditId) return next(new NotFoundError("Audit record not found"));

    this.auditLogs
      .findByAuditId(auditId)
      .then(async (auditLog) => {
        if (!auditLog) throw new NotFoundError("Audit record not found");
        const verified = await this.service().verifyAudit(auditId, auditLog.payloadHash);
        const updatedAudit = verified
          ? await this.auditLogs.markVerified(auditId)
          : await this.auditLogs.markFailed(auditId, "On-chain hash verification failed");
        res.status(200).json({ verified, audit: updatedAudit });
      })
      .catch(next);
  }

  private service() {
    this.blockchainAuditService ??= new BlockchainAuditService();
    return this.blockchainAuditService;
  }

  private async safeChainAudit(auditId: string) {
    try {
      return await this.service().getAudit(auditId);
    } catch {
      return null;
    }
  }
}
