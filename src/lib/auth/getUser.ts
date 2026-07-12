import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Extract and validate the authenticated user from a request.
 *
 * Resolution order:
 * 1. `Authorization: Bearer <jwt>` header  ← preferred, cryptographically verified
 * 2. `x-user-email` header                 ← legacy fallback during migration
 * 3. `email` query param                   ← legacy fallback during migration
 *
 * The fallbacks remain until all clients send JWTs; remove them after that.
 */
export function getAuthUser(req: NextRequest): AuthUser | null {
  // 1. JWT bearer token
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    const verified = verifyToken(auth.slice(7));
    if (verified) return verified;
    // Token present but invalid — reject immediately (don't fall through)
    return null;
  }

  // 2. Legacy email header
  const headerEmail = (req.headers.get("x-user-email") ?? "").trim().toLowerCase();
  if (headerEmail) return { userId: "", email: headerEmail };

  // 3. Legacy query param
  const paramEmail = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (paramEmail) return { userId: "", email: paramEmail };

  return null;
}

/**
 * Like getAuthUser but returns an error response instead of null.
 * Use at the top of API route handlers that require authentication.
 */
export function requireAuth(req: NextRequest): { user: AuthUser } | { error: Response } {
  const user = getAuthUser(req);
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ success: false, error: "Authentication required." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }
  return { user };
}
