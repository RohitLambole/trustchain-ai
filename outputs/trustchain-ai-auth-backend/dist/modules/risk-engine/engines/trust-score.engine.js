"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustScoreEngine = void 0;
class TrustScoreEngine {
    calculate(input) {
        const baseScore = input.trustProfile?.currentTrustScore ?? 70;
        const signals = [];
        let score = baseScore;
        if (input.device) {
            this.apply(signals, "DEVICE_TRUST_SCORE", input.device.trustScore, this.scaleDeviceTrust(input.device.trustScore), "Device trust contributes to identity confidence");
            if (input.device.trustLevel === "TRUSTED") {
                this.apply(signals, "TRUSTED_DEVICE", true, 10, "Device is explicitly trusted");
            }
            if (input.device.trustLevel === "UNKNOWN") {
                this.apply(signals, "UNKNOWN_DEVICE", true, -8, "Device is known but not trusted");
            }
            if (input.device.trustLevel === "SUSPICIOUS") {
                this.apply(signals, "SUSPICIOUS_DEVICE", true, -25, "Device is marked suspicious");
            }
            if (input.device.trustLevel === "BLOCKED") {
                this.apply(signals, "BLOCKED_DEVICE", true, -100, "Device is blocked");
            }
            if (input.device.failedLoginCount >= 3) {
                this.apply(signals, "DEVICE_FAILED_LOGINS", input.device.failedLoginCount, -Math.min(input.device.failedLoginCount * 5, 25), "Device has repeated failed logins");
            }
            if (input.device.totpSuccessCount > 0) {
                this.apply(signals, "DEVICE_TOTP_SUCCESS", input.device.totpSuccessCount, Math.min(input.device.totpSuccessCount * 3, 12), "Device has successful TOTP history");
            }
        }
        const highRiskEvents = (input.recentRiskEvents ?? []).filter((event) => event.severity === "HIGH" || event.severity === "CRITICAL");
        if (highRiskEvents.length > 0) {
            this.apply(signals, "RECENT_HIGH_RISK_EVENTS", highRiskEvents.length, -Math.min(highRiskEvents.length * 12, 36), "Recent high-risk events reduce trust");
        }
        const anomalies = (input.mlPredictions ?? []).filter((prediction) => prediction.isAnomaly);
        if (anomalies.length > 0) {
            const maxAnomaly = Math.max(...anomalies.map((prediction) => prediction.anomalyScore));
            this.apply(signals, "ML_ANOMALY", maxAnomaly, -Math.round(maxAnomaly * 30), "ML service detected anomalous behavior");
        }
        if (input.session?.authMethod === "PASSWORD_TOTP") {
            this.apply(signals, "SESSION_TOTP_AUTHENTICATED", true, 8, "Current session used TOTP");
        }
        const finalScore = this.clamp(score + signals.reduce((total, signal) => total + signal.weight, 0));
        return { baseScore, finalScore, signals };
    }
    apply(signals, name, value, weight, reason) {
        signals.push({ name, value, weight, reason });
    }
    scaleDeviceTrust(deviceTrustScore) {
        if (deviceTrustScore >= 75)
            return 8;
        if (deviceTrustScore >= 45)
            return 0;
        if (deviceTrustScore > 0)
            return -18;
        return -100;
    }
    clamp(score) {
        return Math.max(0, Math.min(100, Math.round(score)));
    }
}
exports.TrustScoreEngine = TrustScoreEngine;
