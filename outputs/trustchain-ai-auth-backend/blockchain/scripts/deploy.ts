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
  const deploymentTx = auditTrail.deploymentTransaction();
  await auditTrail.waitForDeployment();
  const receipt = deploymentTx ? await deploymentTx.wait() : null;

  const address = await auditTrail.getAddress();
  const explorerUrl = network.config.chainId === 80002 ? `https://amoy.polygonscan.com/address/${address}` : undefined;
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    contractName: "AuditTrail",
    address,
    deployer: deployer.address,
    owner: deployer.address,
    deploymentTransactionHash: deploymentTx?.hash,
    deploymentBlockNumber: receipt?.blockNumber,
    explorerUrl,
    deployedAt: new Date().toISOString()
  };

  const outputDir = join(__dirname, "..", "deployments");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, `${network.name}.json`), `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
