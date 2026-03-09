"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { setAccessToken, setUnauthenticatedHandler, apiFetch } from "@/lib/apiFetch";

// ─── Types — mirrors your AccessPayload + prisma select ───────────────────────

export type Role = "MARKETER" | "AGENCY_ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** Call right after a successful POST /api/auth/login with the returned accessToken */
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  /**
   * Fetch /api/auth/me using whatever access token is currently stored.
   * Your /me endpoint returns { user: { id, email, name, role, createdAt } }
   */
  const fetchMe = useCallback(async () => {
    try {
      const { user } = await apiFetch<{ user: AuthUser }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  /**
   * Session bootstrap — runs once on mount.
   * 1. Hit /api/auth/refresh to get a fresh access token from the cookie.
   * 2. Store it in memory.
   * 3. Fetch /api/auth/me to populate the user object.
   */
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          const { accessToken } = await res.json();
          setAccessToken(accessToken);
          await fetchMe();
        }
        // If refresh fails (no cookie / revoked) → user stays null, that's fine
      } catch {
        // Network error — leave user as null
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchMe]);

  /** Register the "kick to login" handler with apiFetch */
  useEffect(() => {
    setUnauthenticatedHandler(() => {
      setUser(null);
      window.location.href = "/login";
    });
  }, []);

  /**
   * Call this from your login page after a successful POST /api/auth/login.
   * Stores the access token and fetches the user profile.
   */
  const login = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      await fetchMe();
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    try {
      // Your logout route should revoke the refresh token in the DB and clear the cookie
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // best-effort
    }
    setAccessToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}