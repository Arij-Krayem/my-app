"use client";

import { useAuth, Role } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RequireRoleProps {
  role: Role | Role[];
  children: React.ReactNode;
}

/**
 * Renders children only if the logged-in user has the required role.
 * Otherwise redirects to /dashboard with an "unauthorized" flag.
 *
 * Usage:
 *   <RequireRole role="AGENCY_ADMIN">
 *     <UsersPage />
 *   </RequireRole>
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (loading) return;
    if (!user || !allowed.includes(user.role)) {
      router.replace("/dashboard?unauthorized=1");
    }
  }, [user, loading]);

  if (loading) return null;
  if (!user || !allowed.includes(user.role)) return null;

  return <>{children}</>;
}