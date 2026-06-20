import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.AUDIT_TRAIL_CONTRACT_ADDRESS;
  const auditId = process.env.AUDIT_ID;
  const eventHash = process.env.EVENT_HASH;

  if (!contractAddress || !auditId || !eventHash) {
    throw new Error("AUDIT_TRAIL_CONTRACT_ADDRESS, AUDIT_ID, and EVENT_HASH are required");
  }

  const auditTrail = await ethers.getContractAt("AuditTrail", contractAddress);
  const verified = await auditTrail.verifyAudit(auditId, eventHash);
  console.log(JSON.stringify({ auditId, eventHash, verified }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
