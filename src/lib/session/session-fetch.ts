"use client";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_URL = "/api/auth/refresh";
const LOGIN_URL = "/login";

let installed = false;
let refreshPromise: Promise<string | null> | null = null;
let originalFetch: typeof window.fetch | null = null;

function isApiUrl(input: RequestInfo | URL) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  if (url.startsWith("/api/")) return true;

  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

function isSessionControlUrl(input: RequestInfo | URL) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    const parsed = new URL(url, window.location.origin);
    return ["/api/auth/login", "/api/auth/logout", REFRESH_URL].includes(parsed.pathname);
  } catch {
    return ["/api/auth/login", "/api/auth/logout", REFRESH_URL].some((path) =>
      url.startsWith(path)
    );
  }
}

function withSessionHeaders(init?: RequestInit, token?: string | null): RequestInit {
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return {
    ...init,
    credentials: init?.credentials ?? "include",
    headers,
  };
}

async function refreshAccessToken() {
  if (!originalFetch) return null;

  if (!refreshPromise) {
    refreshPromise = originalFetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        return typeof data?.accessToken === "string" ? data.accessToken : null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function endSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem("user");

  if (window.location.pathname !== LOGIN_URL) {
    window.location.href = LOGIN_URL;
  }
}

export function installSessionFetchInterceptor() {
  if (installed || typeof window === "undefined") return;

  installed = true;
  originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!originalFetch || !isApiUrl(input) || isSessionControlUrl(input)) {
      return originalFetch ? originalFetch(input, init) : fetch(input, init);
    }

    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const firstInit = withSessionHeaders(init, token);
    let response = await originalFetch(input, firstInit);

    if (response.status !== 401) {
      return response;
    }

    const latestToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (latestToken && latestToken !== token) {
      response = await originalFetch(input, withSessionHeaders(init, latestToken));

      if (response.status !== 401) {
        return response;
      }
    }

    const nextToken = await refreshAccessToken();

    if (!nextToken) {
      endSession();
      return response;
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, nextToken);
    response = await originalFetch(input, withSessionHeaders(init, nextToken));

    if (response.status === 401) {
      endSession();
    }

    return response;
  };
}
