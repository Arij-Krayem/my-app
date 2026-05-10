"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { writeSessionUser } from "@/lib/session-user";
import styles from "../auth.module.css";

const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required.")
    .min(6, "Email must be at least 6 characters.")
    .email("Please enter a valid email address."),
  password: z.string()
    .min(1, "Password is required.")
    .min(6, "Password must be at least 6 characters."),
});
type LoginForm = z.infer<typeof loginSchema>;

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);

const ErrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

const EyeOn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" /></svg>
);

const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("registered") === "true"
      ? "Account created! Please sign in."
      : "";
  });
  const [pendingApproval, setPendingApproval] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const emailVal = useWatch({ control, name: "email" }) ?? "";

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    if (sessionStorage.getItem("access_token")) router.push("/dashboard");
  }, [router]);

  const onSubmit = async (values: LoginForm) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.status === 403 && data.pendingApproval) {
        setPendingApproval(true); setLoading(false); return;
      }
      if (res.status === 403 && data.error === "account_inactive") {
        setServerError("Your account has been deactivated. Please contact your administrator.");
        setLoading(false); return;
      }
      if (!res.ok) {
        setServerError(data.error ?? data.message ?? "Invalid credentials");
        setLoading(false); return;
      }
      sessionStorage.setItem("access_token", data.accessToken);
      writeSessionUser(data.user);
      router.push("/dashboard");
    } catch {
      setServerError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const inputClass = (name: keyof LoginForm, withAction = false) => [
    styles.input,
    withAction ? styles.inputWithAction : "",
    errors[name] ? styles.inputError : "",
    touchedFields[name] && !errors[name] ? styles.inputValid : "",
  ].filter(Boolean).join(" ");

  if (pendingApproval) {
    return (
      <div className={styles.approvalPage}>
        <div className={styles.approvalCard}>
          <div className={styles.approvalIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <h2 className={styles.approvalTitle}>Awaiting Approval</h2>
          <p className={styles.approvalText}>
            Your account has been created and is currently <strong>pending admin approval</strong>. You will receive an email notification once your account is activated.
          </p>
          <div className={styles.approvalInfo}>
            <div className={styles.approvalInfoTitle}>What happens next?</div>
            {["The admin reviews your registration request", "You receive an approval email", "Click the link in the email to log in"].map((step, i) => (
              <div key={i} className={styles.approvalStep}>
                <div className={styles.approvalStepNumber}>{i + 1}</div>
                <span className={styles.approvalStepText}>{step}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setPendingApproval(false)} className={styles.textButton}>Back to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.orbPrimary} />
      <div className={styles.orbSecondary} />

      <div className={styles.panelWrap}>
        <div className={styles.panelHeader}>
          <div className={styles.brandMark}>V</div>
          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.subheading}>Sign in to your VisioAd account</p>
        </div>

        <div className={styles.card}>
          {successMsg && (
            <div className={`${styles.message} ${styles.messageSuccess}`}>
              <CheckIcon />
              {successMsg}
            </div>
          )}

          {serverError && (
            <div className={`${styles.message} ${styles.messageError}`}>
              <ErrIcon />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.formGroupMd}>
              <label className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><MailIcon /></span>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@visioad.com"
                  autoComplete="email"
                  className={inputClass("email")}
                />
                {touchedFields.email && !errors.email && emailVal && (
                  <span className={styles.validIcon}><CheckIcon /></span>
                )}
              </div>
              {errors.email && (
                <p className={styles.errorText}>
                  <ErrIcon />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className={styles.formGroupLg}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  Password <span className={styles.required}>*</span>
                </label>
                <Link href="/forgot-password" className={styles.forgotLink}>Forgot?</Link>
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><LockIcon /></span>
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClass("password", true)}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className={styles.passwordToggle}>
                  {showPw ? <EyeOn /> : <EyeOff />}
                </button>
              </div>
              {errors.password && (
                <p className={styles.errorText}>
                  <ErrIcon />
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? <><span className={styles.spinner} />Signing in...</> : "Sign In →"}
            </button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>OR</span>
            <div className={styles.dividerLine} />
          </div>

          <Link href="/register" className={styles.secondaryLink}>
            Create an account
          </Link>
        </div>

        <p className={styles.footerNote}>
          © 2026 VisioAd · Full-Service Brand Advertising Agency
        </p>
      </div>
    </div>
  );
}
