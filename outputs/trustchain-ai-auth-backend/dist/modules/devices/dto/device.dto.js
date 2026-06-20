"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockDeviceDtoSchema = exports.TrustDeviceDtoSchema = exports.RegisterDeviceDtoSchema = exports.DeviceFingerprintDtoSchema = void 0;
const zod_1 = require("zod");
exports.DeviceFingerprintDtoSchema = zod_1.z.object({
    userAgent: zod_1.z.string().min(1).max(1024).optional(),
    browser: zod_1.z.string().max(128).optional(),
    os: zod_1.z.string().max(128).optional(),
    screenResolution: zod_1.z.string().regex(/^[0-9]{2,5}x[0-9]{2,5}$/).optional(),
    timezone: zod_1.z.string().max(128).optional(),
    language: zod_1.z.string().max(64).optional(),
    platform: zod_1.z.string().max(128).optional(),
    ipAddress: zod_1.z.string().max(128).optional()
});
exports.RegisterDeviceDtoSchema = zod_1.z.object({
    fingerprint: exports.DeviceFingerprintDtoSchema
});
exports.TrustDeviceDtoSchema = zod_1.z.object({
    deviceId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/)
});
exports.BlockDeviceDtoSchema = zod_1.z.object({
    deviceId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/),
    reason: zod_1.z.string().min(3).max(500)
});
