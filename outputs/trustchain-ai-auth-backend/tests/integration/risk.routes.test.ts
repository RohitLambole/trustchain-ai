import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import type { Express } from "express";
import http from "node:http";
import mongoose from "mongoose";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/trustchain_ai_integration_test";
process.env.JWT_ACCESS_SECRET ??= "integration-access-secret-change-before-production-123456";
process.env.JWT_REFRESH_SECRET ??= "integration-refresh-secret-change-before-production-123456";
process.env.FIELD_ENCRYPTION_KEY_BASE64 ??= "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
process.env.BOOTSTRAP_DATABASE_ON_START = "false";
process.env.ML_SERVICE_URL = "http://127.0.0.1:18081";
process.env.ML_REQUEST_TIMEOUT_MS = "500";
process.env.ML_REQUEST_RETRIES = "1";

let app: Express;
let disconnectDatabase: () => Promise<void>;
let accessToken = "";
let userId = "";
let mlServer: http.Server;
let anchoredAuditId = "";

before(async () => {
  mlServer = http.createServer((req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/health") {
      res.end(JSON.stringify({ status: "ok", service: "test-ml", models_loaded: 3, models_expected: 3 }));
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/predict/")) {
      res.end(JSON.stringify({
        anomaly_score: 0.91,
        is_anomaly: true,
        risk_level: "HIGH",
        explanation: ["integration_ml_anomaly"],
        model_name: "integration_test_model",
        model_version: "1.0.0"
      }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not found" }));
  });
  await new Promise<void>((resolve) => mlServer.listen(18081, "127.0.0.1", () => resolve()));

  const database = await import("../../src/config/database");
  const appModule = await import("../../src/app");
  const seederModule = await import("../../src/bootstrap/database-seeder");
  const userModule = await import("../../src/modules/users/persistence/user.model");

  disconnectDatabase = database.disconnectDatabase;
  app = appModule.createApp();

  await database.connectDatabase();
  await mongoose.connection.db?.dropDatabase();
  await new seederModule.DatabaseSeeder().seed();

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ email: "analyst@trustchain.local", password: "DemoAnalyst!2026" })
    .expect(200);

  accessToken = loginResponse.body.accessToken;
  const customer = await userModule.UserModel.findOne({ email: "customer@trustchain.local" }).exec();
  assert.ok(customer);
  userId = customer._id.toString();
});

after(async () => {
  await mongoose.connection.db?.dropDatabase();
  await disconnectDatabase();
  await new Promise<void>((resolve) => mlServer.close(() => resolve()));
});

test("POST /api/risk/evaluate evaluates and persists a risk decision", async () => {
  const response = await request(app)
    .post("/api/risk/evaluate")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      userId,
      eventType: "HIGH_RISK_LOGIN_DECISION",
      eventCategory: "AUTHENTICATION",
      action: "auth.login",
      resource: "sessions",
      context: { channel: "integration-test" }
    })
    .expect(201);

  assert.ok(response.body.decision);
  assert.equal(response.body.mlResult.available, true);
  assert.equal(response.body.mlResult.response.anomaly_score, 0.91);
  assert.equal(typeof response.body.decision.riskScore, "number");
  assert.equal(typeof response.body.decision.trustScore, "number");
  assert.ok(response.body.blockchainAudit);
  assert.equal(response.body.blockchainAudit.verified, false);
  anchoredAuditId = response.body.blockchainAudit.auditId;
});

test("GET /api/risk/events returns risk events", async () => {
  const response = await request(app)
    .get("/api/risk/events")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.ok(Array.isArray(response.body.events));
  assert.ok(response.body.events.length >= 1);
});

test("GET /api/risk/high-risk-events returns high and critical events", async () => {
  const response = await request(app)
    .get("/api/risk/high-risk-events?limit=10")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.ok(Array.isArray(response.body.events));
  assert.ok(response.body.events.every((event: { severity: string }) => ["HIGH", "CRITICAL"].includes(event.severity)));
});

test("GET /api/risk/trust-score/:userId returns trust score profile", async () => {
  const response = await request(app)
    .get(`/api/risk/trust-score/${userId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.equal(response.body.trustScore.userId, userId);
  assert.equal(typeof response.body.trustScore.currentTrustScore, "number");
});

test("GET /api/risk/dashboard returns dashboard aggregates", async () => {
  const response = await request(app)
    .get("/api/risk/dashboard")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.ok(Array.isArray(response.body.highRiskEvents));
  assert.ok(Array.isArray(response.body.trustScoreTrends));
  assert.equal(typeof response.body.anomalyCounts.total, "number");
  assert.equal(response.body.mlHealth.available, true);
  assert.equal(typeof response.body.riskDistribution, "object");
  assert.ok(Array.isArray(response.body.recentDecisions));
  assert.equal(typeof response.body.blockchainStatus, "object");
  assert.equal(typeof response.body.auditVerificationStatus, "object");
});

test("GET /api/blockchain-audit/events returns anchored audit metadata", async () => {
  const response = await request(app)
    .get("/api/blockchain-audit/events")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.ok(Array.isArray(response.body.events));
  assert.ok(response.body.events.some((event: { auditId: string }) => event.auditId === anchoredAuditId));
});

test("GET /api/blockchain-audit/:auditId returns local audit metadata when chain unavailable", async () => {
  const response = await request(app)
    .get(`/api/blockchain-audit/${anchoredAuditId}`)
    .set("Authorization", `Bearer ${accessToken}`)
    .expect(200);

  assert.equal(response.body.localAudit.auditId, anchoredAuditId);
  assert.equal(response.body.localAudit.integrityStatus, "FAILED");
});
