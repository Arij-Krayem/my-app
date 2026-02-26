"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <p>Role: {user?.role}</p>
      <button onClick={logout} style={{ marginTop: 16 }}>Log out</button>
    </div>
  );
}