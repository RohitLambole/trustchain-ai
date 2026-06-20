"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionEngine = void 0;
class DecisionEngine {
    decide(aggregate) {
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
    actionForScore(riskScore, trustScore) {
        if (trustScore <= 10 || riskScore >= 90)
            return "LOCK_ACCOUNT";
        if (riskScore >= 80)
            return "BLOCK";
        if (riskScore >= 65)
            return "CREATE_CASE";
        if (riskScore >= 40)
            return "STEP_UP_TOTP";
        if (riskScore >= 20)
            return "ALLOW_MONITOR";
        return "ALLOW";
    }
    enforcementActions(decision) {
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
    highestPrecedence(actions) {
        return actions.reduce((highest, action) => this.maxAction(highest, action), "ALLOW");
    }
    maxAction(a, b) {
        return this.rank(b) > this.rank(a) ? b : a;
    }
    rank(action) {
        const ranks = {
            ALLOW: 0,
            ALLOW_MONITOR: 1,
            STEP_UP_TOTP: 2,
            CREATE_CASE: 3,
            BLOCK: 4,
            LOCK_ACCOUNT: 5
        };
        return ranks[action];
    }
    normalizeAction(action) {
        if (action === "DENY")
            return "BLOCK";
        if (["ALLOW", "ALLOW_MONITOR", "STEP_UP_TOTP", "BLOCK", "LOCK_ACCOUNT", "CREATE_CASE"].includes(action)) {
            return action;
        }
        return "ALLOW_MONITOR";
    }
}
exports.DecisionEngine = DecisionEngine;
