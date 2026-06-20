"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskPolicyRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const risk_policy_model_1 = require("./risk-policy.model");
class RiskPolicyRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(risk_policy_model_1.RiskPolicyModel);
    }
    findActivePolicies() {
        return risk_policy_model_1.RiskPolicyModel.find({ enabled: true }).sort({ priority: 1, createdAt: 1 }).exec();
    }
}
exports.RiskPolicyRepository = RiskPolicyRepository;
