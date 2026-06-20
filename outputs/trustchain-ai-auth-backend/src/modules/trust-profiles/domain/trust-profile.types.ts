import type { ObjectId } from "../../../shared/types/common";

export interface TrustScoreHistory {
  score: number;
  reason: string;
  eventId?: ObjectId;
  at: Date;
}

export interface TrustProfile {
  _id: ObjectId;
  userId: ObjectId;
  currentTrustScore: number;
  baselineBehavior: Record<string, unknown>;
  knownDevices: ObjectId[];
  knownLocations: Array<{ country?: string; region?: string; city?: string }>;
  riskFlags: string[];
  scoreHistory: TrustScoreHistory[];
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
