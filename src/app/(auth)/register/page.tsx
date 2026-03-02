"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [theme, setTheme]           = useState("dark");
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    const t = localStorage.getItem("theme") || "dark";
    setTheme(t); document.documentElement.setAttribute("data-theme", t);
    if (sessionStorage.getItem("access_token")) router.push("/dashboard");
  }, [router]);

  const toggleTheme = () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n); localStorage.setItem("theme", n);
    document.documentElement.setAttribute("data-theme", n);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", background: "var(--input)", border: "1px solid var(--border)",
    borderRadius: "10px", color: "var(--t1)", fontSize: "14px",
    outline: "none", fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: "600",
    color: "var(--t2)", letterSpacing: "0.5px",
    textTransform: "uppercase", marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(88,101,242,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 65%)", pointerEvents: "none" }} />

      <button onClick={toggleTheme} style={{ position: "fixed", top: "20px", right: "20px", zIndex: 100, width: "38px", height: "38px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1, animation: "fadeUp 0.4s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 6px 24px rgba(88,101,242,0.35)", fontSize: "22px", fontWeight: "800", color: "white" }}>V</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Create account</h1>
          <p style={{ fontSize: "13px", color: "var(--t2)" }}>Start monitoring your ad campaigns</p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", lineHeight: 1, pointerEvents: "none" }}>👤</span>
                <input type="text" value={name} required onChange={e => setName(e.target.value)} placeholder="John Doe"
                  style={{ ...inputStyle, padding: "11px 12px 11px 38px" }}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", lineHeight: 1, pointerEvents: "none" }}>✉️</span>
                <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="you@visioad.com"
                  style={{ ...inputStyle, padding: "11px 12px 11px 38px" }}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", lineHeight: 1, pointerEvents: "none" }}>🔑</span>
                <input type={showPw ? "text" : "password"} value={password} required onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  style={{ ...inputStyle, padding: "11px 40px 11px 38px" }}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--t3)", fontSize: "14px", lineHeight: 1, padding: "2px" }}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", lineHeight: 1, pointerEvents: "none" }}>🔑</span>
                <input type={showPw ? "text" : "password"} value={confirm} required onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                  style={{ ...inputStyle, padding: "11px 12px 11px 38px" }}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "var(--t3)" : "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 16px rgba(88,101,242,0.35)", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Creating...</> : "Create Account →"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "11px", color: "var(--t3)", letterSpacing: "0.5px" }}>HAVE AN ACCOUNT?</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <Link href="/login" style={{ display: "block", textAlign: "center", padding: "11px", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "13px", fontWeight: "500", textDecoration: "none", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#5865f2"; (e.currentTarget as HTMLElement).style.color = "#5865f2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; }}>
            Sign in instead
          </Link>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--t3)", marginTop: "20px" }}>© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}