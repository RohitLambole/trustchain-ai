import { BaseRepository } from "../../../shared/repositories/base.repository";
import type { TrustProfile } from "../domain/trust-profile.types";
import { TrustProfileModel } from "./trust-profile.model";

export class TrustProfileRepository extends BaseRepository<TrustProfile> {
  constructor() {
    super(TrustProfileModel);
  }

  findByUserId(userId: string) {
    return TrustProfileModel.findOne({ userId }).exec();
  }

  createDefault(userId: string) {
    return TrustProfileModel.create({
      userId,
      currentTrustScore: 70,
      baselineBehavior: {},
      knownDevices: [],
      knownLocations: [],
      riskFlags: [],
      scoreHistory: [{ score: 70, reason: "USER_REGISTERED", at: new Date() }],
      lastCalculatedAt: new Date()
    });
  }

  updateTrustScore(userId: string, score: number, reason: string, eventId?: string) {
    return TrustProfileModel.findOneAndUpdate(
      { userId },
      {
        $set: { currentTrustScore: score, lastCalculatedAt: new Date() },
        $push: {
          scoreHistory: {
            score,
            reason,
            eventId,
            at: new Date()
          }
        }
      },
      { new: true, upsert: true }
    ).exec();
  }
}
