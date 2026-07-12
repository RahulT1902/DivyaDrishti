/**
 * Authenticated fetch for web client — injects JWT Bearer token from localStorage.
 * Falls back to x-user-email header for sessions predating JWT migration.
 */
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("divya:token") : null;
  const email = typeof window !== "undefined" ? window.localStorage.getItem("divya:userEmail") : null;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (email) {
    headers.set("x-user-email", email);
  }

  return fetch(input, { ...init, headers });
}
