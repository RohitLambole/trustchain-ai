import axios, { AxiosInstance } from "axios";
import { env } from "../../../config/env";
import { StructuredLogger } from "../../../shared/logger/structured-logger";
import type { MlFeatureContext, MlPredictionResponse, MlPredictionResult, MlRiskKind } from "../domain/ml-client.types";

export class MLClientService {
  private readonly client: AxiosInstance;
  private readonly logger = new StructuredLogger("MLClientService");

  constructor() {
    this.client = axios.create({
      baseURL: env.ML_SERVICE_URL,
      timeout: env.ML_REQUEST_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" }
    });
  }

  async health() {
    try {
      const { data } = await this.withRetry(() => this.client.get("/health"));
      return { available: true, data };
    } catch (error) {
      const message = this.errorMessage(error);
      this.logger.warn("ml_health_unavailable", { error: message });
      return { available: false, error: message };
    }
  }

  async predict(context: MlFeatureContext): Promise<MlPredictionResult> {
    const kind = this.kindFor(context);
    const features = this.featuresFor(kind, context);
    const endpoint = this.endpointFor(kind);

    try {
      const { data } = await this.withRetry(() => this.client.post<MlPredictionResponse>(endpoint, features));
      this.logger.info("ml_prediction_success", {
        kind,
        modelName: data.model_name,
        modelVersion: data.model_version,
        anomalyScore: data.anomaly_score,
        riskLevel: data.risk_level
      });
      return { available: true, kind, features, response: data };
    } catch (error) {
      const message = this.errorMessage(error);
      this.logger.warn("ml_prediction_unavailable", { kind, endpoint, error: message });
      return { available: false, kind, features, error: message };
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= env.ML_REQUEST_RETRIES) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt >= env.ML_REQUEST_RETRIES) break;
        const delayMs = 150 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt += 1;
      }
    }

    throw lastError;
  }

  private kindFor(context: MlFeatureContext): MlRiskKind {
    const text = `${context.eventCategory} ${context.eventType}`.toUpperCase();
    if (text.includes("RECOVERY")) return "recovery";
    if (text.includes("INSIDER") || text.includes("PRIVILEGED")) return "insider";
    return "login";
  }

  private endpointFor(kind: MlRiskKind) {
    if (kind === "recovery") return "/predict/recovery-risk";
    if (kind === "insider") return "/predict/insider-risk";
    return "/predict/login-risk";
  }

  private featuresFor(kind: MlRiskKind, context: MlFeatureContext): Record<string, number> {
    if (kind === "recovery") return this.recoveryFeatures(context);
    if (kind === "insider") return this.insiderFeatures(context);
    return this.loginFeatures(context);
  }

  private loginFeatures(context: MlFeatureContext) {
    const createdAt = context.device?.firstSeenAt ? new Date(context.device.firstSeenAt).getTime() : Date.now();
    return {
      login_hour: this.hour(context),
      failed_attempts: context.device?.failedLoginCount ?? this.numberContext(context, "failed_attempts", 0),
      device_age_days: Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000)),
      device_changes_30d: this.numberContext(context, "device_changes_30d", context.device?.suspiciousActivityCount ?? 0),
      geo_change: this.booleanNumber(context.context?.geo_change),
      trust_score: context.trustProfile?.currentTrustScore ?? 70
    };
  }

  private recoveryFeatures(context: MlFeatureContext) {
    return {
      recovery_hour: this.hour(context),
      failed_recovery_attempts_7d: this.numberContext(context, "failed_recovery_attempts_7d", context.device?.recoveryAttemptCount ?? 0),
      contact_change_24h: this.booleanNumber(context.context?.contact_change_24h),
      new_device: context.device && context.device.successfulLoginCount === 0 ? 1 : 0,
      geo_change: this.booleanNumber(context.context?.geo_change),
      account_age_days: this.numberContext(context, "account_age_days", 365),
      trust_score: context.trustProfile?.currentTrustScore ?? 70
    };
  }

  private insiderFeatures(context: MlFeatureContext) {
    return {
      access_hour: this.hour(context),
      records_accessed_1h: this.numberContext(context, "records_accessed_1h", 25),
      privileged_action_count_24h: this.numberContext(context, "privileged_action_count_24h", 1),
      after_hours_access: this.isAfterHours(this.hour(context)) ? 1 : 0,
      peer_deviation_score: this.numberContext(context, "peer_deviation_score", 20),
      failed_admin_actions_24h: this.numberContext(context, "failed_admin_actions_24h", 0),
      sensitive_case_access: this.booleanNumber(context.context?.sensitive_case_access)
    };
  }

  private hour(context: MlFeatureContext) {
    return this.numberContext(context, "hour", new Date().getHours());
  }

  private numberContext(context: MlFeatureContext, key: string, fallback: number) {
    const value = context.context?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  private booleanNumber(value: unknown) {
    return value === true || value === 1 ? 1 : 0;
  }

  private isAfterHours(hour: number) {
    return hour < 7 || hour > 20;
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Unknown ML service error";
  }
}
