"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ position: "fixed", top: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(108,99,255,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-80px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg,#6c63ff,#818cf8)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white", marginBottom: "12px", boxShadow: "0 6px 24px rgba(108,99,255,0.35)" }}>V</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Forgot password?</h1>
          <p style={{ fontSize: "13px", color: "var(--t2)" }}>Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", marginBottom: "8px" }}>Check your inbox</h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.6", marginBottom: "20px" }}>
                We sent a password reset link to <strong style={{ color: "var(--t1)" }}>{email}</strong>. Check your spam folder if you don&apos;t see it.
              </p>
              <Link href="/login" style={{ display: "block", textAlign: "center", padding: "11px", background: "linear-gradient(135deg,#6c63ff,#818cf8)", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", letterSpacing: "0.5px", textTransform: "uppercase" as const, marginBottom: "6px" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", pointerEvents: "none" }}>✉️</span>
                    <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="you@visioad.com"
                      style={{ width: "100%", padding: "11px 12px 11px 38px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      onFocus={e => { e.target.style.borderColor = "#6c63ff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.15)"; }}
                      onBlur={e =>  { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ width: "100%", padding: "12px", background: loading ? "var(--t3)" : "linear-gradient(135deg,#6c63ff,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Sending...</> : "Send Reset Link →"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: "18px" }}>
                <Link href="/login" style={{ fontSize: "13px", color: "var(--t2)", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6c63ff"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t2)"}>
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--t3)", marginTop: "20px" }}>© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
      </div>
    </div>
  );
}
