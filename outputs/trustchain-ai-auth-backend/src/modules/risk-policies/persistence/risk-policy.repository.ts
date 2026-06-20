import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { RiskPolicy } from "../domain/risk-policy.types";
import { RiskPolicyModel } from "./risk-policy.model";

export class RiskPolicyRepository extends BaseRepository<RiskPolicy> {
  constructor() {
    super(RiskPolicyModel);
  }

  findActivePolicies() {
    return RiskPolicyModel.find({ enabled: true }).sort({ priority: 1, createdAt: 1 }).exec();
  }
}
