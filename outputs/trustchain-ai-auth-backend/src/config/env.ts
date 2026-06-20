import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default("trustchain-ai"),
  JWT_AUDIENCE: z.string().default("trustchain-ai-api"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
  PASSWORD_BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  TOTP_ISSUER: z.string().default("TrustChain AI"),
  FIELD_ENCRYPTION_KEY_BASE64: z.string().min(40),
  PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  BLOCKCHAIN_RPC_URL: z.string().url().default("http://127.0.0.1:8545"),
  AUDIT_TRAIL_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  BACKEND_WRITER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional()
});

export const env = EnvSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
