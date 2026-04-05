/**
 * apiFetch — smart fetch wrapper that:
 *  1. Reads the in-memory access token (set by AuthProvider after login/refresh)
 *  2. Attaches `Authorization: Bearer <token>`
 *  3. On 401 → calls POST /api/auth/refresh once, updates the token, retries
 *  4. On second 401 → clears session and calls the registered unauthenticated handler
 */

let _accessToken: string | null = null;
let _onUnauthenticated: (() => void) | null = null;

/** Called by AuthProvider on login / after a successful refresh */
export function setAccessToken(token: string | null) {
  _accessToken = token;
}

/** Called by AuthProvider so apiFetch can trigger a logout/redirect */
export function setUnauthenticatedHandler(handler: () => void) {
  _onUnauthenticated = handler;
}

async function silentRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // sends the httpOnly refreshToken cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const buildHeaders = (token: string | null): HeadersInit => {
    const headers = new Headers(options.headers ?? {});

    // Let the browser set the multipart boundary for FormData requests.
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  };

  let res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: buildHeaders(_accessToken),
  });

  if (res.status === 401) {
    const newToken = await silentRefresh();

    if (newToken) {
      setAccessToken(newToken);
      res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: buildHeaders(newToken),
      });
    }

    // Still 401 after refresh attempt → session is dead
    if (res.status === 401) {
      setAccessToken(null);
      _onUnauthenticated?.();
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
