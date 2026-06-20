"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngine = void 0;
class PolicyEngine {
    evaluate(input, policies) {
        const facts = this.buildFacts(input);
        return policies
            .filter((policy) => policy.enabled)
            .filter((policy) => policy.conditions.every((condition) => this.matches(condition, facts)))
            .map((policy) => ({
            policyId: policy._id.toString(),
            name: policy.name,
            action: policy.action,
            severity: policy.severity,
            weight: policy.weight,
            priority: policy.priority,
            reasons: policy.conditions.map((condition) => `${condition.field} ${condition.operator} ${String(condition.value)}`)
        }));
    }
    builtInMatches(input) {
        const matches = [];
        if (input.device?.trustLevel === "BLOCKED") {
            matches.push(this.match("Blocked device", "BLOCK", "CRITICAL", 100, 1, "Device is blocked"));
        }
        if (input.user.status === "LOCKED" || input.user.status === "SUSPENDED" || input.user.status === "CLOSED") {
            matches.push(this.match("Inactive user status", "BLOCK", "CRITICAL", 100, 1, `User status is ${input.user.status}`));
        }
        if (input.device?.trustLevel === "SUSPICIOUS") {
            matches.push(this.match("Suspicious device requires step-up", "STEP_UP_TOTP", "HIGH", 35, 20, "Device trust level is suspicious"));
        }
        if ((input.device?.failedLoginCount ?? 0) >= 5) {
            matches.push(this.match("Failed login spike", "LOCK_ACCOUNT", "CRITICAL", 60, 10, "Device has five or more failed logins"));
        }
        const highRiskEvents = (input.recentRiskEvents ?? []).filter((event) => event.severity === "HIGH" || event.severity === "CRITICAL");
        if (highRiskEvents.length >= 3) {
            matches.push(this.match("Recent high-risk activity", "CREATE_CASE", "HIGH", 35, 30, "User has repeated high-risk events"));
        }
        const highAnomaly = (input.mlPredictions ?? []).some((prediction) => prediction.isAnomaly && prediction.anomalyScore >= 0.85);
        if (highAnomaly) {
            matches.push(this.match("High ML anomaly", "STEP_UP_TOTP", "HIGH", 30, 25, "ML anomaly score exceeds threshold"));
        }
        return matches;
    }
    buildFacts(input) {
        return {
            eventType: input.eventType,
            eventCategory: input.eventCategory,
            action: input.action,
            resource: input.resource,
            userStatus: input.user.status,
            userKycStatus: input.user.kycStatus,
            sessionStatus: input.session?.status,
            sessionAuthMethod: input.session?.authMethod,
            deviceTrustLevel: input.device?.trustLevel,
            deviceTrustScore: input.device?.trustScore,
            deviceFailedLogins: input.device?.failedLoginCount,
            deviceFraudFlagCount: input.device?.fraudFlags.length ?? 0,
            recentHighRiskEventCount: (input.recentRiskEvents ?? []).filter((event) => event.severity === "HIGH" || event.severity === "CRITICAL").length,
            maxMlAnomalyScore: Math.max(0, ...(input.mlPredictions ?? []).map((prediction) => prediction.anomalyScore)),
            hasMlAnomaly: (input.mlPredictions ?? []).some((prediction) => prediction.isAnomaly),
            ...(input.context ?? {})
        };
    }
    matches(condition, facts) {
        const actual = facts[condition.field];
        switch (condition.operator) {
            case "eq":
                return actual === condition.value;
            case "neq":
                return actual !== condition.value;
            case "gt":
                return Number(actual) > Number(condition.value);
            case "gte":
                return Number(actual) >= Number(condition.value);
            case "lt":
                return Number(actual) < Number(condition.value);
            case "lte":
                return Number(actual) <= Number(condition.value);
            case "in":
                return Array.isArray(condition.value) && condition.value.includes(actual);
            case "contains":
                return Array.isArray(actual) && actual.includes(condition.value);
        }
    }
    match(name, action, severity, weight, priority, reason) {
        return { name, action, severity, weight, priority, reasons: [reason] };
    }
}
exports.PolicyEngine = PolicyEngine;
