import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { RiskEvent } from "../domain/risk-event.types";
import { RiskEventModel } from "./risk-event.model";

export class RiskEventRepository extends BaseRepository<RiskEvent> {
  constructor() {
    super(RiskEventModel);
  }

  findRecentByDevice(deviceId: string, limit = 20) {
    return RiskEventModel.find({ deviceId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  findRecentByUser(userId: string, limit = 25) {
    return RiskEventModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  countRecentHighRiskByDevice(deviceId: string, since: Date) {
    return RiskEventModel.countDocuments({
      deviceId,
      severity: { $in: ["HIGH", "CRITICAL"] },
      createdAt: { $gte: since }
    }).exec();
  }
}
