import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer signer available");
  }

  const AuditTrail = await ethers.getContractFactory("AuditTrail");
  const auditTrail = await AuditTrail.deploy(deployer.address);
  await auditTrail.waitForDeployment();

  const address = await auditTrail.getAddress();
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    contractName: "AuditTrail",
    address,
    owner: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const outputDir = join(__dirname, "..", "deployments");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, `${network.name}.json`), `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`AuditTrail deployed to ${address} on ${network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
