import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { RiskEvent } from "../domain/risk-event.types";
import { RiskEventModel } from "./risk-event.model";
import type { FilterQuery } from "mongoose";

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

  findEvents(filter: FilterQuery<RiskEvent>, limit = 50, skip = 0) {
    return RiskEventModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  }

  findHighRiskEvents(limit = 50) {
    return RiskEventModel.find({ severity: { $in: ["HIGH", "CRITICAL"] } }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  countBySeverity(since?: Date) {
    const match = since ? { createdAt: { $gte: since } } : {};
    return RiskEventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]).exec();
  }

  countByDecision(since?: Date) {
    const match = since ? { createdAt: { $gte: since } } : {};
    return RiskEventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$decision", count: { $sum: 1 } } }
    ]).exec();
  }
}
