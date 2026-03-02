"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme]       = useState("dark");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const t = localStorage.getItem("theme") || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    if (sessionStorage.getItem("access_token")) router.push("/dashboard");
    if (new URLSearchParams(window.location.search).get("registered") === "true")
      setError("__success__Account created! Please sign in.");
  }, [router]);

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n); localStorage.setItem("theme", n);
    document.documentElement.setAttribute("data-theme", n);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      sessionStorage.setItem("access_token", data.accessToken);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  };

  const isSuccess = error.startsWith("__success__");
  const msg       = isSuccess ? error.replace("__success__", "") : error;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden", fontFamily: "'Outfit', sans-serif" }}>
      {/* Glow */}
      <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(88,101,242,0.12) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Theme toggle */}
      <button onClick={toggleTheme} style={{ position: "fixed", top: "20px", right: "20px", zIndex: 100, width: "38px", height: "38px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1, animation: "fadeUp 0.4s ease both" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 6px 24px rgba(88,101,242,0.35)", fontSize: "22px", fontWeight: "800", color: "white" }}>V</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Welcome back</h1>
          <p style={{ fontSize: "13px", color: "var(--t2)" }}>Sign in to your VisioAd account</p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", background: isSuccess ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)", color: isSuccess ? "#3fb950" : "#f85149", border: `1px solid ${isSuccess ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)"}` }}>
              {isSuccess ? "✓" : "⚠"} {msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>Email</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>✉️</span>
                <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="you@visioad.com"
                  style={{ width: "100%", padding: "11px 12px 11px 38px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--t2)", letterSpacing: "0.5px", textTransform: "uppercase" }}>Password</label>
                <a href="#" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none" }}>Forgot?</a>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>🔑</span>
                <input type={showPw ? "text" : "password"} value={password} required onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: "100%", padding: "11px 40px 11px 38px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--t3)", fontSize: "14px", lineHeight: 1, padding: "2px" }}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "var(--t3)" : "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 16px rgba(88,101,242,0.35)", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Signing in...</> : "Sign In →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "11px", color: "var(--t3)", letterSpacing: "0.5px" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <Link href="/register" style={{ display: "block", textAlign: "center", padding: "11px", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "13px", fontWeight: "500", textDecoration: "none", transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#5865f2"; (e.currentTarget as HTMLElement).style.color = "#5865f2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; }}>
            Create an account
          </Link>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--t3)", marginTop: "20px" }}>© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}