import type { ObjectId, RiskSeverity, TrustDecision } from "../../../shared/types/common";

export type RiskPolicyOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";

export interface RiskPolicyCondition {
  field: string;
  operator: RiskPolicyOperator;
  value: unknown;
}

export interface RiskPolicy {
  _id: ObjectId;
  name: string;
  description?: string;
  enabled: boolean;
  conditions: RiskPolicyCondition[];
  action: TrustDecision;
  severity: RiskSeverity;
  priority: number;
  weight: number;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
