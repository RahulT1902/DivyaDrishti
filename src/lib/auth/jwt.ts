import { createHmac } from "crypto";

const SECRET =
  process.env.JWT_SECRET ||
  "divyadrishti-dev-secret-change-before-production";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

function b64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function fromB64url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function signToken(userId: string, email: string): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      userId,
      email,
      iat: Date.now(),
      exp: Date.now() + TOKEN_TTL_MS,
    } satisfies TokenPayload),
  );
  const sig = sign(`${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    // Constant-time signature check
    const expected = sign(`${header}.${payload}`);
    if (sig.length !== expected.length) return null;
    let mismatch = 0;
    for (let i = 0; i < sig.length; i++) {
      mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const data: TokenPayload = JSON.parse(fromB64url(payload));
    if (data.exp < Date.now()) return null;
    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}
