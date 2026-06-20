"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOrigins = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    MONGODB_URI: zod_1.z.string().min(1),
    CORS_ORIGINS: zod_1.z.string().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ISSUER: zod_1.z.string().default("trustchain-ai"),
    JWT_AUDIENCE: zod_1.z.string().default("trustchain-ai-api"),
    ACCESS_TOKEN_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
    PASSWORD_BCRYPT_ROUNDS: zod_1.z.coerce.number().int().min(10).max(15).default(12),
    TOTP_ISSUER: zod_1.z.string().default("TrustChain AI"),
    FIELD_ENCRYPTION_KEY_BASE64: zod_1.z.string().min(40),
    PASSWORD_RESET_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(900)
});
exports.env = EnvSchema.parse(process.env);
exports.corsOrigins = exports.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
