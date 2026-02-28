"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0f12",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "#6b7280",
        fontSize: 14,
        gap: 10,
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}