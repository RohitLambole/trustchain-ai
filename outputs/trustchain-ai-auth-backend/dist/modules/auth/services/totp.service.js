"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TotpService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const env_1 = require("../../../config/env");
class TotpService {
    generateSecret(email) {
        return speakeasy_1.default.generateSecret({
            name: `${env_1.env.TOTP_ISSUER}:${email}`,
            issuer: env_1.env.TOTP_ISSUER,
            length: 32
        });
    }
    async createQrDataUrl(otpauthUrl) {
        return qrcode_1.default.toDataURL(otpauthUrl);
    }
    verify(code, secretBase32) {
        return speakeasy_1.default.totp.verify({
            secret: secretBase32,
            encoding: "base32",
            token: code,
            window: 1
        });
    }
}
exports.TotpService = TotpService;
