import crypto from "crypto";
import { env } from "../../config/env";

const algorithm = "aes-256-gcm";

function getKey(): Buffer {
  const key = Buffer.from(env.FIELD_ENCRYPTION_KEY_BASE64, "base64");
  if (key.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY_BASE64 must decode to 32 bytes");
  }
  return key;
}

export function encryptField(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptField(cipherText: string): string {
  const [version, iv, authTag, encrypted] = cipherText.split(":");
  if (version !== "v1" || !iv || !authTag || !encrypted) {
    throw new Error("Unsupported encrypted field format");
  }

  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
