import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("AuditTrail", () => {
  async function deployFixture() {
    const [owner, backendWriter, unauthorized] = await ethers.getSigners();
    const AuditTrail = await ethers.getContractFactory("AuditTrail");
    const auditTrail = await AuditTrail.deploy(owner.address);
    await auditTrail.waitForDeployment();
    return { auditTrail, owner, backendWriter, unauthorized };
  }

  it("allows owner backend writer to record audit", async () => {
    const { auditTrail, owner } = await deployFixture();
    const auditId = ethers.id("audit-1");
    const userId = ethers.id("user-1");
    const eventType = ethers.id("RISK_ENGINE_FINAL_DECISION");
    const eventHash = ethers.id("canonical-event-payload");

    await expect(auditTrail.connect(owner).recordAudit(auditId, userId, eventType, 3, eventHash))
      .to.emit(auditTrail, "AuditRecorded")
      .withArgs(auditId, userId, eventType, 3, eventHash, anyValue, owner.address);

    const record = await auditTrail.getAudit(auditId);
    expect(record.eventHash).to.equal(eventHash);
    expect(await auditTrail.verifyAudit(auditId, eventHash)).to.equal(true);
  });

  it("allows owner to grant backend writer access", async () => {
    const { auditTrail, owner, backendWriter } = await deployFixture();
    await auditTrail.connect(owner).setBackendWriter(backendWriter.address, true);

    await auditTrail
      .connect(backendWriter)
      .recordAudit(ethers.id("audit-2"), ethers.id("user-2"), ethers.id("ACCOUNT_LOCKED"), 3, ethers.id("payload"));

    expect(await auditTrail.auditCount()).to.equal(1);
  });

  it("rejects unauthorized writers", async () => {
    const { auditTrail, unauthorized } = await deployFixture();

    await expect(
      auditTrail
        .connect(unauthorized)
        .recordAudit(ethers.id("audit-3"), ethers.id("user-3"), ethers.id("LOGIN_HIGH_RISK"), 2, ethers.id("payload"))
    ).to.be.revertedWithCustomError(auditTrail, "NotBackendWriter");
  });

  it("rejects duplicate audit IDs", async () => {
    const { auditTrail, owner } = await deployFixture();
    const auditId = ethers.id("audit-4");

    await auditTrail.connect(owner).recordAudit(auditId, ethers.id("user-4"), ethers.id("KYC_DECISION"), 2, ethers.id("payload-a"));

    await expect(
      auditTrail.connect(owner).recordAudit(auditId, ethers.id("user-4"), ethers.id("KYC_DECISION"), 2, ethers.id("payload-b"))
    ).to.be.revertedWithCustomError(auditTrail, "AuditAlreadyExists");
  });
});
