import { NotFoundError } from "../../../shared/errors/app-error";
import { DeviceRepository } from "../../devices/persistence/device.repository";
import { MlPredictionRepository } from "../../ml-predictions/persistence/ml-prediction.repository";
import { RiskEventRepository } from "../../risk-events/persistence/risk-event.repository";
import { RiskPolicyRepository } from "../../risk-policies/persistence/risk-policy.repository";
import { SessionRepository } from "../../sessions/persistence/session.repository";
import { TrustProfileRepository } from "../../trust-profiles/persistence/trust-profile.repository";
import { UserRepository } from "../../users/persistence/user.repository";
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
    private readonly decisionEngine = new DecisionEngine()
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
    const mlPredictions = await this.mlPredictions.findRecentByUser(input.userId, 10);

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

    await this.persistEvaluation(input, result);
    return result;
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
  }
}
