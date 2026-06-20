export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DeviceTrustLevel = "TRUSTED" | "UNKNOWN" | "SUSPICIOUS" | "BLOCKED";
export type UserRole = "CUSTOMER" | "SECURITY_ANALYST" | "FRAUD_ANALYST" | "SOC_MANAGER" | "PRIVILEGED_ADMIN" | "SUPER_ADMIN" | "AUDITOR";

export interface AuthUser {
  id: string;
  email: string;
  status: string;
  kycStatus: string;
  totpEnabled: boolean;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface Device {
  _id: string;
  browser: string;
  os: string;
  lastIpAddress: string;
  firstSeenAt: string;
  lastSeenAt: string;
  trustScore: number;
  trustLevel: DeviceTrustLevel;
  successfulLoginCount: number;
  failedLoginCount: number;
  riskFlags: string[];
}

export interface RiskEvent {
  _id: string;
  eventCategory: string;
  eventType: string;
  severity: RiskLevel;
  riskScore: number;
  trustScoreAfter?: number;
  decision: string;
  createdAt: string;
}

export interface BlockchainAuditRecord {
  auditId: string;
  userId: string;
  eventType: string;
  riskLevel: RiskLevel;
  eventHash: string;
  timestamp: string;
  writer: string;
  verified?: boolean;
}

export interface AuditLogRecord {
  _id: string;
  auditId: string;
  actorId?: string;
  subjectId?: string;
  action: string;
  resource: string;
  eventType: string;
  riskLevel?: RiskLevel;
  payloadHash: string;
  blockchainTxHash?: string;
  blockNumber?: number;
  integrityStatus: "PENDING" | "ANCHORED" | "VERIFIED" | "FAILED";
  failureReason?: string;
  createdAt: string;
}

export interface TrustScoreResponse {
  userId: string;
  currentTrustScore: number;
  riskFlags: string[];
  lastCalculatedAt: string;
  scoreHistory: Array<{ score: number; reason: string; at: string; sourceId?: string }>;
}

export interface RiskDashboardResponse {
  highRiskEvents: RiskEvent[];
  trustScoreTrends: Array<{
    userId: string;
    currentTrustScore: number;
    history: Array<{ score: number; reason: string; at: string; sourceId?: string }>;
  }>;
  anomalyCounts: {
    total: number;
    recentSamples: number;
  };
  mlHealth: Record<string, unknown>;
  blockchainStatus: {
    configured: boolean;
    auditVerificationStatus: Record<string, number>;
  };
  auditVerificationStatus: Record<string, number>;
  riskDistribution: Record<string, number>;
  recentDecisions: RiskEvent[];
  decisionDistribution: Record<string, number>;
}

export interface AdminDashboardResponse {
  stats: {
    users: number;
    roles: number;
    permissions: number;
    devices: number;
    auditEvents: number;
    health: string;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    status: string;
    roles: string[];
    lastLoginAt?: string;
    createdAt?: string;
  }>;
}

export interface MlPredictionResponse {
  anomaly_score: number;
  is_anomaly: boolean;
  risk_level: RiskLevel;
  explanation: string[];
  model_name: string;
  model_version: string;
}
