import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, original] = storedHash.split(":");
  if (!salt || !original) return false;

  const derived = scryptSync(password, salt, KEY_LENGTH);
  const originalBuffer = Buffer.from(original, "hex");

  if (derived.length !== originalBuffer.length) return false;
  return timingSafeEqual(derived, originalBuffer);
}

