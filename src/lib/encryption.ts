/**
 * AES-256-GCM encryption for sensitive config answers (passwords, tokens, API keys).
 * Key is derived from NEXTAUTH_SECRET via SHA-256 so no extra env var is needed.
 * Ciphertext format: iv_hex.authTag_hex.encrypted_hex
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHash("sha256").update(String(secret)).digest();
}

const ALGO = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(".");
  if (parts.length !== 3) throw new Error("Invalid ciphertext format");
  const [ivHex, tagHex, encHex] = parts;
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/** Returns true if the value looks like our encrypted format. */
export function isEncryptedValue(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 3 && parts[0].length === 24 && /^[0-9a-f]+$/i.test(parts[0]);
}
