import { createHash } from "crypto";

export function canonicalizeAuditPayload(payload: Record<string, unknown>): string {
  return JSON.stringify(sortObject(payload));
}

export function createAuditEventHash(payload: Record<string, unknown>): string {
  return `0x${createHash("sha256").update(canonicalizeAuditPayload(payload)).digest("hex")}`;
}

export function verifyAuditEventHash(payload: Record<string, unknown>, expectedHash: string): boolean {
  return createAuditEventHash(payload).toLowerCase() === expectedHash.toLowerCase();
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortObject((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}
