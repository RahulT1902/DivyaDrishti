import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Extract and validate the authenticated user from a request.
 *
 * Only a cryptographically verified `Authorization: Bearer <jwt>` header is
 * accepted. The legacy `x-user-email` header and `email` query param were
 * removed: they let anyone act as any user just by knowing their email.
 */
export function getAuthUser(req: NextRequest): AuthUser | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
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
