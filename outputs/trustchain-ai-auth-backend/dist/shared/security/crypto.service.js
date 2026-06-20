"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptField = encryptField;
exports.decryptField = decryptField;
exports.sha256 = sha256;
exports.createOpaqueToken = createOpaqueToken;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const algorithm = "aes-256-gcm";
function getKey() {
    const key = Buffer.from(env_1.env.FIELD_ENCRYPTION_KEY_BASE64, "base64");
    if (key.length !== 32) {
        throw new Error("FIELD_ENCRYPTION_KEY_BASE64 must decode to 32 bytes");
    }
    return key;
}
function encryptField(plainText) {
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(algorithm, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}
function decryptField(cipherText) {
    const [version, iv, authTag, encrypted] = cipherText.split(":");
    if (version !== "v1" || !iv || !authTag || !encrypted) {
        throw new Error("Unsupported encrypted field format");
    }
    const decipher = crypto_1.default.createDecipheriv(algorithm, getKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(authTag, "base64"));
    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64")),
        decipher.final()
    ]).toString("utf8");
}
function sha256(value) {
    return crypto_1.default.createHash("sha256").update(value).digest("hex");
}
function createOpaqueToken(bytes = 32) {
    return crypto_1.default.randomBytes(bytes).toString("base64url");
}
