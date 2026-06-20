import { Contract, JsonRpcProvider, Wallet, id, isHexString } from "ethers";
import { env } from "../../../config/env";
import { AppError } from "../../../shared/errors/app-error";
import type { RiskSeverity } from "../../../shared/types/common";
import { AuditTrailAbi } from "../contracts/audit-trail.abi";
import type { BlockchainAuditPayload, BlockchainAuditRecord } from "../domain/blockchain-audit.types";

interface AuditTrailContract {
  recordAudit(auditId: string, userId: string, eventType: string, riskLevel: number, eventHash: string): Promise<{ hash: string; wait(): Promise<{ hash?: string; blockNumber?: number } | null> }>;
  getAudit(auditId: string): Promise<{
    auditId: string;
    userId: string;
    eventType: string;
    riskLevel: bigint | number;
    eventHash: string;
    timestamp: bigint;
    writer: string;
  }>;
  verifyAudit(auditId: string, expectedEventHash: string): Promise<boolean>;
  auditCount(): Promise<bigint>;
  getAuditIdAt(index: number): Promise<string>;
}

const riskLevelToChain: Record<RiskSeverity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};

const chainToRiskLevel: Record<number, RiskSeverity> = {
  0: "LOW",
  1: "MEDIUM",
  2: "HIGH",
  3: "CRITICAL"
};

export class BlockchainAuditService {
  private readonly provider: JsonRpcProvider;
  private readonly contract: AuditTrailContract;

  constructor() {
    if (!env.AUDIT_TRAIL_CONTRACT_ADDRESS) {
      throw new AppError(503, "BLOCKCHAIN_NOT_CONFIGURED", "AuditTrail contract address is not configured");
    }

    this.provider = new JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
    const runner = env.BACKEND_WRITER_PRIVATE_KEY
      ? new Wallet(env.BACKEND_WRITER_PRIVATE_KEY, this.provider)
      : this.provider;

    this.contract = new Contract(env.AUDIT_TRAIL_CONTRACT_ADDRESS, AuditTrailAbi, runner) as unknown as AuditTrailContract;
  }

  async recordAudit(payload: BlockchainAuditPayload) {
    this.assertBytes32(payload.auditId, "auditId");
    this.assertBytes32(payload.userId, "userId");
    this.assertBytes32(payload.eventHash, "eventHash");

    const tx = await this.contract.recordAudit(
      payload.auditId,
      payload.userId,
      id(payload.eventType),
      riskLevelToChain[payload.riskLevel],
      payload.eventHash
    );
    const receipt = await tx.wait();

    return {
      transactionHash: receipt?.hash ?? tx.hash,
      blockNumber: receipt?.blockNumber
    };
  }

  async getAudit(auditId: string): Promise<BlockchainAuditRecord> {
    this.assertBytes32(auditId, "auditId");
    const record = await this.contract.getAudit(auditId);

    return {
      auditId: record.auditId,
      userId: record.userId,
      eventType: record.eventType,
      riskLevel: chainToRiskLevel[Number(record.riskLevel)] ?? "LOW",
      eventHash: record.eventHash,
      timestamp: record.timestamp.toString(),
      writer: record.writer
    };
  }

  async verifyAudit(auditId: string, eventHash: string): Promise<boolean> {
    this.assertBytes32(auditId, "auditId");
    this.assertBytes32(eventHash, "eventHash");
    return this.contract.verifyAudit(auditId, eventHash);
  }

  async listAuditIds(limit = 50, offset = 0): Promise<string[]> {
    const count = Number(await this.contract.auditCount());
    const end = Math.min(count, offset + limit);
    const ids: string[] = [];

    for (let index = offset; index < end; index += 1) {
      ids.push(await this.contract.getAuditIdAt(index));
    }

    return ids;
  }

  private assertBytes32(value: string, field: string) {
    if (!isHexString(value, 32)) {
      throw new AppError(400, "INVALID_BYTES32", `${field} must be a 32-byte hex string`);
    }
  }
}
