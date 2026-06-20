"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustProfileModel = void 0;
const mongoose_1 = require("mongoose");
const TrustProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentTrustScore: { type: Number, min: 0, max: 100, default: 70, index: true },
    baselineBehavior: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    knownDevices: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Device" }],
    knownLocations: [{ country: String, region: String, city: String }],
    riskFlags: [{ type: String, index: true }],
    scoreHistory: [
        {
            score: { type: Number, min: 0, max: 100 },
            reason: String,
            eventId: { type: mongoose_1.Schema.Types.ObjectId },
            at: { type: Date, default: Date.now }
        }
    ],
    lastCalculatedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true, versionKey: false });
exports.TrustProfileModel = (0, mongoose_1.model)("TrustProfile", TrustProfileSchema, "trust_profiles");
