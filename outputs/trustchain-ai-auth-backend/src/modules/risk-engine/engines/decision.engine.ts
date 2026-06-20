import type { RiskDecision, RiskEngineDecision } from "../domain/risk-engine.types";
import type { AggregatedRisk } from "../domain/risk-engine.types";

export class DecisionEngine {
  decide(aggregate: AggregatedRisk): RiskDecision {
    const policyActions = aggregate.policyMatches.map((policy) => this.normalizeAction(policy.action));
    const highestPolicyAction = this.highestPrecedence(policyActions);
    const scoreAction = this.actionForScore(aggregate.riskScore, aggregate.trustScore);
    const decision = this.maxAction(highestPolicyAction, scoreAction);
    const enforcementActions = this.enforcementActions(decision);

    return {
      decision,
      severity: aggregate.severity,
      riskScore: aggregate.riskScore,
      trustScore: aggregate.trustScore,
      enforcementActions,
      reasons: [
        ...aggregate.explanation,
        ...aggregate.policyMatches.flatMap((policy) => policy.reasons.map((reason) => `${policy.name}: ${reason}`))
      ]
    };
  }

  private actionForScore(riskScore: number, trustScore: number): RiskEngineDecision {
    if (trustScore <= 10 || riskScore >= 90) return "LOCK_ACCOUNT";
    if (riskScore >= 80) return "BLOCK";
    if (riskScore >= 65) return "CREATE_CASE";
    if (riskScore >= 40) return "STEP_UP_TOTP";
    if (riskScore >= 20) return "ALLOW_MONITOR";
    return "ALLOW";
  }

  private enforcementActions(decision: RiskEngineDecision): RiskEngineDecision[] {
    switch (decision) {
      case "ALLOW":
        return ["ALLOW"];
      case "ALLOW_MONITOR":
        return ["ALLOW_MONITOR"];
      case "STEP_UP_TOTP":
        return ["STEP_UP_TOTP"];
      case "CREATE_CASE":
        return ["STEP_UP_TOTP", "CREATE_CASE"];
      case "BLOCK":
        return ["BLOCK", "CREATE_CASE"];
      case "LOCK_ACCOUNT":
        return ["BLOCK", "LOCK_ACCOUNT", "CREATE_CASE"];
    }
  }

  private highestPrecedence(actions: RiskEngineDecision[]) {
    return actions.reduce<RiskEngineDecision>((highest, action) => this.maxAction(highest, action), "ALLOW");
  }

  private maxAction(a: RiskEngineDecision, b: RiskEngineDecision) {
    return this.rank(b) > this.rank(a) ? b : a;
  }

  private rank(action: RiskEngineDecision) {
    const ranks: Record<RiskEngineDecision, number> = {
      ALLOW: 0,
      ALLOW_MONITOR: 1,
      STEP_UP_TOTP: 2,
      CREATE_CASE: 3,
      BLOCK: 4,
      LOCK_ACCOUNT: 5
    };
    return ranks[action];
  }

  private normalizeAction(action: string): RiskEngineDecision {
    if (action === "DENY") return "BLOCK";
    if (["ALLOW", "ALLOW_MONITOR", "STEP_UP_TOTP", "BLOCK", "LOCK_ACCOUNT", "CREATE_CASE"].includes(action)) {
      return action as RiskEngineDecision;
    }
    return "ALLOW_MONITOR";
  }
}
