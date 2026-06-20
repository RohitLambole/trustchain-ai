import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.AUDIT_TRAIL_CONTRACT_ADDRESS;
  const backendWriter = process.env.BACKEND_WRITER_ADDRESS;

  if (!contractAddress || !backendWriter) {
    throw new Error("AUDIT_TRAIL_CONTRACT_ADDRESS and BACKEND_WRITER_ADDRESS are required");
  }

  const auditTrail = await ethers.getContractAt("AuditTrail", contractAddress);
  const tx = await auditTrail.setBackendWriter(backendWriter, true);
  await tx.wait();

  console.log(`Backend writer enabled: ${backendWriter}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
