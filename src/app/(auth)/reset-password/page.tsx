"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid reset link. Please request a new one.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg,#6c63ff,#818cf8)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white", marginBottom: "12px" }}>V</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Set new password</h1>
          <p style={{ fontSize: "13px", color: "var(--t2)" }}>Must be at least 6 characters</p>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", marginBottom: "8px" }}>Password reset!</h2>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.6", marginBottom: "20px" }}>Your password has been updated. Redirecting to sign in...</p>
              <Link href="/login" style={{ display: "block", textAlign: "center", padding: "11px", background: "linear-gradient(135deg,#6c63ff,#818cf8)", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>Sign In Now</Link>
            </div>
          ) : (
            <>
              {error && <div style={{ padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>⚠ {error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase" as const, marginBottom: "6px" }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", pointerEvents: "none" }}>🔑</span>
                    <input type={showPw ? "text" : "password"} value={password} required onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                      style={{ width: "100%", padding: "11px 40px 11px 38px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      onFocus={e => { e.target.style.borderColor = "#6c63ff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>{showPw ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase" as const, marginBottom: "6px" }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", pointerEvents: "none" }}>🔑</span>
                    <input type={showPw ? "text" : "password"} value={confirm} required onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                      style={{ width: "100%", padding: "11px 12px 11px 38px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }}
                      onFocus={e => { e.target.style.borderColor = "#6c63ff"; e.target.style.boxShadow = "0 0 0 3px rgba(108,99,255,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>
                <button type="submit" disabled={loading || !token}
                  style={{ width: "100%", padding: "12px", background: loading ? "var(--t3)" : "linear-gradient(135deg,#6c63ff,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {loading ? <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Saving...</> : "Reset Password →"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: "18px" }}>
                <Link href="/login" style={{ fontSize: "13px", color: "var(--t2)", textDecoration: "none" }}>← Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}