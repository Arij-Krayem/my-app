"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Role } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, user must have one of these roles */
  allowedRoles?: Role[];
  /** Where to send unauthenticated users (default: /login) */
  redirectTo?: string;
  /** Shown while session is being bootstrapped */
  fallback?: ReactNode;
}

/**
 * Wrap any page or layout that requires authentication.
 *
 * @example
 * // Any authenticated user
 * <ProtectedRoute><Dashboard /></ProtectedRoute>
 *
 * @example
 * // Agency admins only
 * <ProtectedRoute allowedRoles={["AGENCY_ADMIN"]}><AdminPanel /></ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
  fallback = null,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(redirectTo); return; }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
    }
  }, [user, loading, allowedRoles, redirectTo, router]);

  if (loading) return <>{fallback}</>;
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}