import type { RiskSeverity } from "../../../shared/types/common";
import type { AggregatedRisk, PolicyMatch, TrustScoreResult } from "../domain/risk-engine.types";
import type { MlPrediction } from "../../ml-predictions/domain/ml-prediction.types";
import type { RiskEvent } from "../../risk-events/domain/risk-event.types";

export class RiskAggregator {
  aggregate(input: {
    trustScore: TrustScoreResult;
    policyMatches: PolicyMatch[];
    recentRiskEvents: RiskEvent[];
    mlPredictions: MlPrediction[];
  }): AggregatedRisk {
    const mlAnomalyScore = Math.max(0, ...input.mlPredictions.map((prediction) => prediction.anomalyScore));
    const recentRiskPenalty = Math.min(
      input.recentRiskEvents.reduce((total, event) => total + this.eventWeight(event.severity), 0),
      35
    );
    const policyPenalty = Math.min(input.policyMatches.reduce((total, policy) => total + policy.weight, 0), 60);
    const trustPenalty = 100 - input.trustScore.finalScore;
    const mlPenalty = Math.round(mlAnomalyScore * 35);

    const riskScore = this.clamp(Math.round(trustPenalty * 0.45 + recentRiskPenalty + policyPenalty + mlPenalty));
    const severity = this.severityFor(riskScore, input.policyMatches);

    return {
      riskScore,
      severity,
      trustScore: input.trustScore.finalScore,
      signals: input.trustScore.signals,
      policyMatches: input.policyMatches.sort((a, b) => a.priority - b.priority),
      mlAnomalyScore,
      explanation: [
        `Trust penalty: ${trustPenalty}`,
        `Recent risk penalty: ${recentRiskPenalty}`,
        `Policy penalty: ${policyPenalty}`,
        `ML penalty: ${mlPenalty}`
      ]
    };
  }

  private eventWeight(severity: RiskSeverity) {
    switch (severity) {
      case "LOW":
        return 2;
      case "MEDIUM":
        return 6;
      case "HIGH":
        return 12;
      case "CRITICAL":
        return 20;
    }
  }

  private severityFor(riskScore: number, policies: PolicyMatch[]): RiskSeverity {
    if (policies.some((policy) => policy.severity === "CRITICAL")) return "CRITICAL";
    if (riskScore >= 85) return "CRITICAL";
    if (riskScore >= 65) return "HIGH";
    if (riskScore >= 35) return "MEDIUM";
    return "LOW";
  }

  private clamp(score: number) {
    return Math.max(0, Math.min(100, score));
  }
}
