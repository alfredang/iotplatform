import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Reversible AES-256-GCM encryption for secrets that must be recovered later
 * (unlike tokens/passwords, which are one-way hashed). Used to store a
 * decryptable copy of an account API key so it can be embedded in outgoing
 * n8n automation events. Key is derived from AUTH_SECRET, so it rotates
 * along with the session-signing secret.
 */

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** Returns null if decryption fails (e.g. secret rotated since encryption). */
export function decryptSecret(payload: string): string | null {
  try {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
