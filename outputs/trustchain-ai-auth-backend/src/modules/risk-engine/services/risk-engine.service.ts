import { NotFoundError } from "../../../shared/errors/app-error";
import { DeviceRepository } from "../../devices/persistence/device.repository";
import { MLClientService } from "../../ml-client/services/ml-client.service";
import { MlPredictionRepository } from "../../ml-predictions/persistence/ml-prediction.repository";
import { RiskEventRepository } from "../../risk-events/persistence/risk-event.repository";
import { RiskPolicyRepository } from "../../risk-policies/persistence/risk-policy.repository";
import { SessionRepository } from "../../sessions/persistence/session.repository";
import { TrustProfileRepository } from "../../trust-profiles/persistence/trust-profile.repository";
import { TrustProfileModel } from "../../trust-profiles/persistence/trust-profile.model";
import { UserRepository } from "../../users/persistence/user.repository";
import { AuditAnchoringService } from "../../blockchain-audit/services/audit-anchoring.service";
import { AuditLogRepository } from "../../audit-logs/persistence/audit-log.repository";
import type { RiskEvaluationInput, RiskEvaluationResult } from "../domain/risk-engine.types";
import { DecisionEngine } from "../engines/decision.engine";
import { PolicyEngine } from "../engines/policy.engine";
import { RiskAggregator } from "../engines/risk-aggregator";
import { TrustScoreEngine } from "../engines/trust-score.engine";

export interface EvaluateRiskByIdInput {
  userId: string;
  sessionId?: string;
  deviceId?: string;
  eventType: string;
  eventCategory: string;
  action?: string;
  resource?: string;
  context?: Record<string, unknown>;
}

export class RiskEngineService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly sessions = new SessionRepository(),
    private readonly devices = new DeviceRepository(),
    private readonly trustProfiles = new TrustProfileRepository(),
    private readonly riskEvents = new RiskEventRepository(),
    private readonly mlPredictions = new MlPredictionRepository(),
    private readonly riskPolicies = new RiskPolicyRepository(),
    private readonly trustScoreEngine = new TrustScoreEngine(),
    private readonly policyEngine = new PolicyEngine(),
    private readonly riskAggregator = new RiskAggregator(),
    private readonly decisionEngine = new DecisionEngine(),
    private readonly mlClient = new MLClientService(),
    private readonly auditAnchoring = new AuditAnchoringService(),
    private readonly auditLogs = new AuditLogRepository()
  ) {}

  async evaluate(input: RiskEvaluationInput): Promise<RiskEvaluationResult> {
    const policies = await this.riskPolicies.findActivePolicies();
    const trustScore = this.trustScoreEngine.calculate(input);
    const policyMatches = [
      ...this.policyEngine.builtInMatches(input),
      ...this.policyEngine.evaluate(input, policies)
    ];

    const aggregate = this.riskAggregator.aggregate({
      trustScore,
      policyMatches,
      recentRiskEvents: input.recentRiskEvents ?? [],
      mlPredictions: input.mlPredictions ?? []
    });

    const decision = this.decisionEngine.decide(aggregate);
    return { trustScore, aggregate, decision };
  }

  async evaluateById(input: EvaluateRiskByIdInput): Promise<RiskEvaluationResult> {
    const user = await this.users.findByIdWithRoles(input.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const session = input.sessionId ? await this.sessions.findById(input.sessionId) : undefined;
    const device = input.deviceId ? await this.devices.findById(input.deviceId) : undefined;
    const trustProfile = await this.trustProfiles.findByUserId(input.userId);
    const recentRiskEvents = await this.riskEvents.findRecentByUser(input.userId, 25);
    const historicalMlPredictions = await this.mlPredictions.findRecentByUser(input.userId, 10);
    const mlResult = await this.mlClient.predict({
      user,
      session: session ?? undefined,
      device: device ?? undefined,
      trustProfile,
      eventType: input.eventType,
      eventCategory: input.eventCategory,
      context: input.context
    });
    const currentMlPrediction = await this.persistMlPrediction(input.userId, mlResult);
    const mlPredictions = currentMlPrediction ? [currentMlPrediction, ...historicalMlPredictions] : historicalMlPredictions;

    const result = await this.evaluate({
      user,
      session: session ?? undefined,
      device: device ?? undefined,
      trustProfile,
      recentRiskEvents,
      mlPredictions,
      eventType: input.eventType,
      eventCategory: input.eventCategory,
      action: input.action,
      resource: input.resource,
      context: input.context
    });
    result.mlResult = mlResult;

    await this.persistEvaluation(input, result);
    return result;
  }

  async getEvents(input: { userId?: string; severity?: string; eventCategory?: string; limit?: number; skip?: number }) {
    const filter: Record<string, unknown> = {};
    if (input.userId) filter.userId = input.userId;
    if (input.severity) filter.severity = input.severity;
    if (input.eventCategory) filter.eventCategory = input.eventCategory;
    return this.riskEvents.findEvents(filter, input.limit ?? 50, input.skip ?? 0);
  }

  async getHighRiskEvents(limit = 50) {
    return this.riskEvents.findHighRiskEvents(limit);
  }

  async getTrustScore(userId: string) {
    const profile = await this.trustProfiles.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Trust profile not found");
    }

    return {
      userId,
      currentTrustScore: profile.currentTrustScore,
      riskFlags: profile.riskFlags,
      lastCalculatedAt: profile.lastCalculatedAt,
      scoreHistory: profile.scoreHistory
    };
  }

  async getDashboard() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [highRiskEvents, riskDistribution, decisionCounts, recentAnomalies, trustProfiles, recentDecisions, anomalyCount, mlHealth, auditStatusRows] = await Promise.all([
      this.riskEvents.findHighRiskEvents(10),
      this.riskEvents.countBySeverity(since),
      this.riskEvents.countByDecision(since),
      this.mlPredictions.findRecentAnomalies(10),
      TrustProfileModel.find({}).sort({ lastCalculatedAt: -1 }).limit(20).exec(),
      this.riskEvents.findEvents({}, 10, 0),
      this.mlPredictions.countRecentAnomalies(since),
      this.mlClient.health(),
      this.auditLogs.countByStatus()
    ]);

    return {
      highRiskEvents,
      trustScoreTrends: trustProfiles.map((profile) => ({
        userId: profile.userId,
        currentTrustScore: profile.currentTrustScore,
        history: profile.scoreHistory.slice(-10)
      })),
      anomalyCounts: {
        total: anomalyCount,
        recentSamples: recentAnomalies.length
      },
      mlHealth,
      blockchainStatus: {
        configured: Boolean(process.env.AUDIT_TRAIL_CONTRACT_ADDRESS),
        auditVerificationStatus: this.toCountMap(auditStatusRows)
      },
      auditVerificationStatus: this.toCountMap(auditStatusRows),
      riskDistribution: this.toCountMap(riskDistribution),
      recentDecisions,
      decisionDistribution: this.toCountMap(decisionCounts)
    };
  }

  private async persistEvaluation(input: EvaluateRiskByIdInput, result: RiskEvaluationResult) {
    const riskEvent = await this.riskEvents.create({
      userId: input.userId as never,
      deviceId: input.deviceId as never,
      eventCategory: input.eventCategory,
      eventType: input.eventType,
      severity: result.decision.severity,
      riskScore: result.decision.riskScore,
      trustScoreAfter: result.decision.trustScore,
      signals: result.aggregate.signals,
      mlScore: result.aggregate.mlAnomalyScore,
      decision: result.decision.decision,
      enforcementAction: result.decision.enforcementActions.join(",")
    });

    await this.trustProfiles.updateTrustScore(
      input.userId,
      result.decision.trustScore,
      `RISK_ENGINE:${input.eventType}`,
      riskEvent._id.toString()
    );

    if (this.auditAnchoring.shouldAnchor(result.decision)) {
      const anchorResult = await this.auditAnchoring.anchorRiskDecision({
        riskEventId: riskEvent._id.toString(),
        userId: input.userId,
        deviceId: input.deviceId,
        eventType: input.eventType,
        eventCategory: input.eventCategory,
        decision: result.decision
      });

      result.blockchainAudit = {
        auditId: anchorResult.auditId,
        eventHash: anchorResult.eventHash,
        transactionHash: anchorResult.transactionHash,
        blockNumber: anchorResult.blockNumber,
        verified: anchorResult.verified,
        error: anchorResult.error
      };
    }
  }

  private async persistMlPrediction(userId: string, mlResult: Awaited<ReturnType<MLClientService["predict"]>>) {
    if (!mlResult.available || !mlResult.response) {
      return null;
    }

    return this.mlPredictions.create({
      userId: userId as never,
      modelName: mlResult.response.model_name,
      modelVersion: mlResult.response.model_version,
      features: mlResult.features,
      anomalyScore: mlResult.response.anomaly_score,
      isAnomaly: mlResult.response.is_anomaly,
      riskLevel: mlResult.response.risk_level,
      explanation: mlResult.response.explanation
    });
  }

  private toCountMap(rows: Array<{ _id: string; count: number }>) {
    return rows.reduce<Record<string, number>>((result, row) => {
      result[row._id] = row.count;
      return result;
    }, {});
  }
}
