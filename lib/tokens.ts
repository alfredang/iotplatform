import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * High-entropy random tokens (API keys, device tokens) are hashed with SHA-256
 * for storage. Because the tokens themselves are random and long, a fast hash
 * is appropriate (and lets us look them up by hash). User passwords use bcrypt
 * instead — see lib/auth.
 */

export type GeneratedToken = {
  /** The full secret, shown to the user exactly once. */
  token: string;
  /** SHA-256 hash stored in the database. */
  hash: string;
  /** Human-readable prefix kept in plaintext for identification in the UI. */
  prefix: string;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiKey(): GeneratedToken {
  const raw = randomBytes(24).toString("base64url");
  const token = `iot_${raw}`;
  return { token, hash: hashToken(token), prefix: token.slice(0, 11) };
}

export function generateDeviceToken(): GeneratedToken {
  const raw = randomBytes(24).toString("base64url");
  const token = `dev_${raw}`;
  return { token, hash: hashToken(token), prefix: token.slice(0, 11) };
}

/** Constant-time comparison of two hex hashes. */
export function hashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
