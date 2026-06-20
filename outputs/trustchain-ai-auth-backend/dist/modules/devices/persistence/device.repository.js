"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceRepository = void 0;
const base_repository_1 = require("../../../shared/repositories/base.repository");
const device_model_1 = require("./device.model");
class DeviceRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(device_model_1.DeviceModel);
    }
    findByUser(userId) {
        return device_model_1.DeviceModel.find({ userId }).sort({ lastSeenAt: -1 }).exec();
    }
    findByUserAndFingerprint(userId, fingerprintHash) {
        return device_model_1.DeviceModel.findOne({ userId, fingerprintHash }).exec();
    }
    touch(deviceId, ipAddress, userAgent) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $set: { lastSeenAt: new Date(), lastIpAddress: ipAddress, userAgent }
        }, { new: true }).exec();
    }
    incrementSuccessfulLogin(deviceId, totpSuccess) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $inc: { successfulLoginCount: 1, totpSuccessCount: totpSuccess ? 1 : 0 },
            $set: { lastSeenAt: new Date() }
        }, { new: true }).exec();
    }
    incrementFailedLogin(deviceId) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $inc: { failedLoginCount: 1 },
            $set: { lastSeenAt: new Date() }
        }, { new: true }).exec();
    }
    incrementRecoveryAttempt(deviceId) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, { $inc: { recoveryAttemptCount: 1 } }, { new: true }).exec();
    }
    incrementSuspiciousActivity(deviceId, flag) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $inc: { suspiciousActivityCount: 1 },
            $addToSet: { riskFlags: flag }
        }, { new: true }).exec();
    }
    updateTrust(deviceId, trustScore, trustLevel) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $set: { trustScore, trustLevel, trusted: trustLevel === "TRUSTED" }
        }, { new: true }).exec();
    }
    block(deviceId, reason) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $set: {
                trustScore: 0,
                trustLevel: "BLOCKED",
                trusted: false,
                blockedAt: new Date(),
                blockedReason: reason
            },
            $addToSet: { riskFlags: "BLOCKED" }
        }, { new: true }).exec();
    }
    unblock(deviceId) {
        return device_model_1.DeviceModel.findByIdAndUpdate(deviceId, {
            $set: { trustLevel: "UNKNOWN", trustScore: 45, trusted: false },
            $unset: { blockedAt: "", blockedReason: "" },
            $pull: { riskFlags: "BLOCKED" }
        }, { new: true }).exec();
    }
}
exports.DeviceRepository = DeviceRepository;
