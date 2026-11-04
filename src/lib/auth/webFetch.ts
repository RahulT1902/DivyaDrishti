const SESSION_KEYS = ["divya:loggedIn", "divya:userEmail", "divya:token"];

/**
 * Authenticated fetch for web client — injects JWT Bearer token from localStorage.
 * A 401 means the token is missing, expired or invalid: the stored session is
 * cleared and the user is sent back to /login.
 */
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("divya:token") : null;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    SESSION_KEYS.forEach(k => window.localStorage.removeItem(k));
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }

  return res;
}
