"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetConfirmDtoSchema = exports.PasswordResetRequestDtoSchema = exports.LogoutDtoSchema = exports.TotpVerifyDtoSchema = exports.RefreshTokenDtoSchema = exports.LoginDtoSchema = exports.RegisterDtoSchema = void 0;
const zod_1 = require("zod");
const device_dto_1 = require("../../devices/dto/device.dto");
const passwordSchema = zod_1.z
    .string()
    .min(12)
    .max(128)
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol");
exports.RegisterDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    phone: zod_1.z.string().min(7).max(20).optional(),
    password: passwordSchema,
    customerId: zod_1.z.string().min(2).max(64).optional(),
    employeeId: zod_1.z.string().min(2).max(64).optional(),
    roleNames: zod_1.z.array(zod_1.z.string().min(1)).default(["CUSTOMER"])
});
exports.LoginDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(1),
    totpCode: zod_1.z.string().regex(/^[0-9]{6}$/).optional(),
    device: device_dto_1.DeviceFingerprintDtoSchema.optional()
});
exports.RefreshTokenDtoSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(32)
});
exports.TotpVerifyDtoSchema = zod_1.z.object({
    code: zod_1.z.string().regex(/^[0-9]{6}$/)
});
exports.LogoutDtoSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(32).optional(),
    allSessions: zod_1.z.boolean().default(false)
});
exports.PasswordResetRequestDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase()
});
exports.PasswordResetConfirmDtoSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    token: zod_1.z.string().min(32),
    newPassword: passwordSchema
});
