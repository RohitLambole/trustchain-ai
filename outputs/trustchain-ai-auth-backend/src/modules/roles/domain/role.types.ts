import type { ObjectId, RiskSeverity } from "../../../shared/types/common";

export interface Permission {
  _id: ObjectId;
  resource: string;
  action: string;
  scope: "SELF" | "LIMITED" | "ANY";
  code: string;
  description?: string;
  riskLevel: RiskSeverity;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  _id: ObjectId;
  name: string;
  description?: string;
  permissions: ObjectId[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}
