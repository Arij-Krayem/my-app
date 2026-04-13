"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Zod schema ────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string()
          .min(1,  "Full name is required.")
          .min(4,  "Full name must be at least 4 characters."),
  email: z.string()
           .min(1,  "Email is required.")
           .min(6,  "Email must be at least 6 characters.")
           .includes("@", { message: "Email must include @." })
           .email("Please enter a valid email address."),
  password: z.string()
              .min(1, "Password is required.")
              .min(6, "Password must be at least 6 characters."),
  confirm: z.string()
             .min(1, "Please confirm your password."),
}).refine(data => data.password === data.confirm, {
  message: "Passwords do not match.",
  path:    ["confirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router  = useRouter();
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const nameVal     = watch("name")     ?? "";
  const emailVal    = watch("email")    ?? "";
  const passwordVal = watch("password") ?? "";
  const confirmVal  = watch("confirm")  ?? "";

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    if (sessionStorage.getItem("access_token")) router.push("/dashboard");
  }, [router]);

  const onSubmit = async (values: RegisterForm) => {
    setServerError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/login?registered=true");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
    } finally { setLoading(false); }
  };

  // ── Field state helpers ────────────────────────────────────────────────────
  const fieldBorder = (name: keyof RegisterForm) => {
    if (errors[name])                          return "#f85149";
    if (touchedFields[name] && !errors[name])  return "#3fb950";
    return "var(--border)";
  };
  const fieldShadow = (name: keyof RegisterForm) => {
    if (errors[name])                          return "0 0 0 3px rgba(248,81,73,0.15)";
    if (touchedFields[name] && !errors[name])  return "0 0 0 3px rgba(63,185,80,0.15)";
    return "none";
  };
  const isValid = (name: keyof RegisterForm) => touchedFields[name] && !errors[name];

  const iconWrap: React.CSSProperties = {
    position: "absolute", left: "12px", top: "50%",
    transform: "translateY(-50%)", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "var(--t3)", pointerEvents: "none", userSelect: "none",
  };

  const inputSt = (name: keyof RegisterForm, extraRight = false): React.CSSProperties => ({
    width: "100%",
    padding: `11px ${extraRight ? "42px" : "12px"} 11px 38px`,
    background: "var(--input)", border: `1px solid ${fieldBorder(name)}`,
    borderRadius: "10px", color: "var(--t1)", fontSize: "14px",
    outline: "none", fontFamily: "inherit",
    boxShadow: fieldShadow(name),
    transition: "border-color 0.2s, box-shadow 0.2s",
  });

  const errMsg: React.CSSProperties = {
    fontSize: "12px", color: "#f85149", marginTop: "5px",
    display: "flex", alignItems: "center", gap: "4px",
  };

  const labelSt: React.CSSProperties = {
    display: "block", fontSize: "11px", fontWeight: "700",
    color: "var(--t2)", letterSpacing: "0.8px",
    textTransform: "uppercase", marginBottom: "7px",
  };

  const star = <span style={{ color: "#f85149" }}>*</span>;

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
  const ErrIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );
  const ICON_USER = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const ICON_MAIL = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  const ICON_LOCK = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  const EYE_ON   = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>;
  const EYE_OFF  = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(88,101,242,0.12) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1, animation: "fadeUp 0.4s ease both" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 6px 24px rgba(88,101,242,0.35)", fontSize: "22px", fontWeight: "800", color: "white" }}>V</div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Create account</h1>
          <p style={{ fontSize: "13px", color: "var(--t2)" }}>Start monitoring your ad campaigns</p>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>

          {serverError && (
            <div style={{ padding: "10px 14px", borderRadius: "9px", marginBottom: "16px", fontSize: "13px", background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)", display: "flex", alignItems: "center", gap: "6px" }}>
              <ErrIcon />{serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* ── Full Name ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelSt}>Full Name {star}</label>
              <div style={{ position: "relative" }}>
                <span style={iconWrap}>{ICON_USER}</span>
                <input {...register("name")} type="text" placeholder="John Doe" autoComplete="name" style={inputSt("name")} />
                {isValid("name") && nameVal && (
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}><CheckIcon /></span>
                )}
              </div>
              {errors.name && <p style={errMsg}><ErrIcon />{errors.name.message}</p>}
            </div>

            {/* ── Email ─────────────────────────────────────────────────── */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelSt}>Email {star}</label>
              <div style={{ position: "relative" }}>
                <span style={iconWrap}>{ICON_MAIL}</span>
                <input {...register("email")} type="email" placeholder="you@visioad.com" autoComplete="email" style={inputSt("email")} />
                {isValid("email") && emailVal && (
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}><CheckIcon /></span>
                )}
              </div>
              {errors.email && <p style={errMsg}><ErrIcon />{errors.email.message}</p>}
            </div>

            {/* ── Password ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelSt}>Password {star}</label>
              <div style={{ position: "relative" }}>
                <span style={iconWrap}>{ICON_LOCK}</span>
                <input {...register("password")} type={showPw ? "text" : "password"} placeholder="Min. 6 characters" autoComplete="new-password" style={inputSt("password", true)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", alignItems: "center", padding: "2px" }}>
                  {showPw ? EYE_ON : EYE_OFF}
                </button>
              </div>
              {errors.password && <p style={errMsg}><ErrIcon />{errors.password.message}</p>}
            </div>

            {/* ── Confirm Password ──────────────────────────────────────── */}
            <div style={{ marginBottom: "22px" }}>
              <label style={labelSt}>Confirm Password {star}</label>
              <div style={{ position: "relative" }}>
                <span style={iconWrap}>{ICON_LOCK}</span>
                <input {...register("confirm")} type={showPw ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password" style={inputSt("confirm")} />
                {isValid("confirm") && confirmVal && (
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}><CheckIcon /></span>
                )}
              </div>
              {errors.confirm && <p style={errMsg}><ErrIcon />{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", background: loading ? "var(--t3)" : "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading ? "none" : "0 4px 16px rgba(88,101,242,0.35)", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading
                ? <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Creating...</>
                : "Create Account →"
              }
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "18px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "11px", color: "var(--t3)", letterSpacing: "0.5px", fontWeight: "600" }}>HAVE AN ACCOUNT?</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <Link href="/login"
            style={{ display: "block", textAlign: "center", padding: "11px", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "13px", fontWeight: "600", textDecoration: "none", transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#5865f2"; (e.currentTarget as HTMLElement).style.color = "#5865f2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; }}>
            Sign in instead
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--t3)", marginTop: "20px" }}>
          © 2026 VisioAd · Full-Service Brand Advertising Agency
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to {opacity:1;transform:translateY(0);} }`}</style>
    </div>
  );
}