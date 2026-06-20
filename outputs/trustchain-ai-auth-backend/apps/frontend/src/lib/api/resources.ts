import { api, mlApi } from "@/lib/api/client";
import type {
  AdminDashboardResponse,
  AuditLogRecord,
  BlockchainAuditRecord,
  Device,
  MlPredictionResponse,
  RiskDashboardResponse,
  RiskEvent,
  TrustScoreResponse
} from "@/types/domain";

export const deviceApi = {
  list: async (): Promise<Device[]> => {
    const { data } = await api.get<{ devices: Device[] }>("/devices");
    return data.devices;
  },
  trust: (deviceId: string) => api.post("/devices/trust", { deviceId }),
  block: (deviceId: string, reason: string) => api.post("/devices/block", { deviceId, reason }),
  unblock: (deviceId: string) => api.post("/devices/unblock", { deviceId })
};

export const riskApi = {
  dashboard: async (): Promise<RiskDashboardResponse> => {
    const { data } = await api.get<RiskDashboardResponse>("/risk/dashboard");
    return data;
  },
  trustScore: async (userId: string): Promise<TrustScoreResponse> => {
    const { data } = await api.get<{ trustScore: TrustScoreResponse }>(`/risk/trust-score/${userId}`);
    return data.trustScore;
  },
  events: async (): Promise<RiskEvent[]> => {
    const { data } = await api.get<{ events: RiskEvent[] }>("/risk/events");
    return data.events;
  },
  highRiskEvents: async (): Promise<RiskEvent[]> => {
    const { data } = await api.get<{ events: RiskEvent[] }>("/risk/high-risk-events");
    return data.events;
  }
};

export const blockchainApi = {
  auditEvents: async (): Promise<AuditLogRecord[]> => {
    const { data } = await api.get<{ events: AuditLogRecord[] }>("/blockchain-audit/events");
    return data.events;
  },
  getById: async (auditId: string): Promise<{ audit: BlockchainAuditRecord | null; localAudit: AuditLogRecord | null }> => {
    const { data } = await api.get<{ audit: BlockchainAuditRecord | null; localAudit: AuditLogRecord | null }>(`/blockchain-audit/${auditId}`);
    return data;
  },
  verifyById: async (auditId: string): Promise<{ verified: boolean; audit: AuditLogRecord | null }> => {
    const { data } = await api.get<{ verified: boolean; audit: AuditLogRecord | null }>(`/blockchain-audit/verify/${auditId}`);
    return data;
  },
  verify: (auditId: string, eventHash: string) => api.post("/blockchain-audit/verify", { auditId, eventHash })
};

export const adminApi = {
  dashboard: async (): Promise<AdminDashboardResponse> => {
    const { data } = await api.get<AdminDashboardResponse>("/admin/dashboard");
    return data;
  }
};

export const mlRiskApi = {
  loginRisk: async (): Promise<MlPredictionResponse> => {
    const { data } = await mlApi.post("/predict/login-risk", {
      login_hour: 2,
      failed_attempts: 8,
      device_age_days: 1,
      device_changes_30d: 4,
      geo_change: 1,
      trust_score: 25
    });
    return data;
  }
};
