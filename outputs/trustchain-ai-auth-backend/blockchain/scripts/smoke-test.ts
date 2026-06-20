import { ethers, network } from "hardhat";

interface ReceiptLog {
  topics: readonly string[];
  data: string;
}

async function main() {
  const contractAddress = process.env.AUDIT_TRAIL_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("AUDIT_TRAIL_CONTRACT_ADDRESS is required");
  }

  const [writer] = await ethers.getSigners();
  if (!writer) {
    throw new Error("No writer signer available");
  }

  const auditTrail = await ethers.getContractAt("AuditTrail", contractAddress);
  const auditId = ethers.id(`trustchain-smoke:${network.name}:${Date.now()}`);
  const userId = ethers.id(`smoke-user:${writer.address}`);
  const eventType = "RISK_ENGINE_FINAL_DECISION";
  const eventHash = ethers.sha256(ethers.toUtf8Bytes(JSON.stringify({
    auditId,
    userId,
    eventType,
    network: network.name,
    writer: writer.address
  })));

  const tx = await auditTrail.recordAudit(auditId, userId, ethers.id(eventType), 2, eventHash);
  const receipt = await tx.wait();
  const record = await auditTrail.getAudit(auditId);
  const verified = await auditTrail.verifyAudit(auditId, eventHash);
  const eventLogged = receipt?.logs.some((log: ReceiptLog) => {
    try {
      return auditTrail.interface.parseLog(log)?.name === "AuditRecorded";
    } catch {
      return false;
    }
  }) ?? false;

  if (!verified || record.eventHash !== eventHash || !eventLogged) {
    throw new Error("Blockchain smoke test failed");
  }

  console.log(JSON.stringify({
    network: network.name,
    chainId: network.config.chainId,
    contractAddress,
    writer: writer.address,
    auditId,
    eventHash,
    transactionHash: tx.hash,
    blockNumber: receipt?.blockNumber,
    eventLogged,
    verified
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
