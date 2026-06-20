"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEngineService = void 0;
const app_error_1 = require("../../../shared/errors/app-error");
const device_repository_1 = require("../../devices/persistence/device.repository");
const ml_prediction_repository_1 = require("../../ml-predictions/persistence/ml-prediction.repository");
const risk_event_repository_1 = require("../../risk-events/persistence/risk-event.repository");
const risk_policy_repository_1 = require("../../risk-policies/persistence/risk-policy.repository");
const session_repository_1 = require("../../sessions/persistence/session.repository");
const trust_profile_repository_1 = require("../../trust-profiles/persistence/trust-profile.repository");
const user_repository_1 = require("../../users/persistence/user.repository");
const decision_engine_1 = require("../engines/decision.engine");
const policy_engine_1 = require("../engines/policy.engine");
const risk_aggregator_1 = require("../engines/risk-aggregator");
const trust_score_engine_1 = require("../engines/trust-score.engine");
class RiskEngineService {
    users;
    sessions;
    devices;
    trustProfiles;
    riskEvents;
    mlPredictions;
    riskPolicies;
    trustScoreEngine;
    policyEngine;
    riskAggregator;
    decisionEngine;
    constructor(users = new user_repository_1.UserRepository(), sessions = new session_repository_1.SessionRepository(), devices = new device_repository_1.DeviceRepository(), trustProfiles = new trust_profile_repository_1.TrustProfileRepository(), riskEvents = new risk_event_repository_1.RiskEventRepository(), mlPredictions = new ml_prediction_repository_1.MlPredictionRepository(), riskPolicies = new risk_policy_repository_1.RiskPolicyRepository(), trustScoreEngine = new trust_score_engine_1.TrustScoreEngine(), policyEngine = new policy_engine_1.PolicyEngine(), riskAggregator = new risk_aggregator_1.RiskAggregator(), decisionEngine = new decision_engine_1.DecisionEngine()) {
        this.users = users;
        this.sessions = sessions;
        this.devices = devices;
        this.trustProfiles = trustProfiles;
        this.riskEvents = riskEvents;
        this.mlPredictions = mlPredictions;
        this.riskPolicies = riskPolicies;
        this.trustScoreEngine = trustScoreEngine;
        this.policyEngine = policyEngine;
        this.riskAggregator = riskAggregator;
        this.decisionEngine = decisionEngine;
    }
    async evaluate(input) {
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
    async evaluateById(input) {
        const user = await this.users.findByIdWithRoles(input.userId);
        if (!user) {
            throw new app_error_1.NotFoundError("User not found");
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
    async persistEvaluation(input, result) {
        const riskEvent = await this.riskEvents.create({
            userId: input.userId,
            deviceId: input.deviceId,
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
        await this.trustProfiles.updateTrustScore(input.userId, result.decision.trustScore, `RISK_ENGINE:${input.eventType}`, riskEvent._id.toString());
    }
}
exports.RiskEngineService = RiskEngineService;
