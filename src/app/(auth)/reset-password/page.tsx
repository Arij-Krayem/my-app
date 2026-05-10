"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../auth.module.css";

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
    <div className={styles.pageSimple}>
      <div className={styles.panelStatic}>
        <div className={styles.panelHeader}>
          <div className={`${styles.brandMarkSmall} ${styles.brandMarkNoShadow}`}>V</div>
          <h1 className={styles.heading}>Set new password</h1>
          <p className={styles.subheading}>Must be at least 6 characters</p>
        </div>
        <div className={`${styles.card} ${styles.cardStrong}`}>
          {success ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successTitle}>Password reset!</h2>
              <p className={styles.successText}>Your password has been updated. Redirecting to sign in...</p>
              <Link href="/login" className={styles.primaryLinkFull}>Sign In Now</Link>
            </div>
          ) : (
            <>
              {error && <div className={`${styles.message} ${styles.messageError}`}>⚠ {error}</div>}
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={`${styles.label} ${styles.labelWide}`}>New Password</label>
                  <div className={styles.inputWrap}>
                    <span className={`${styles.inputIcon} ${styles.emojiIcon}`}>🔑</span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      required
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className={`${styles.input} ${styles.inputWithAction}`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className={styles.passwordToggle}>
                      {showPw ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                <div className={styles.formGroupXL}>
                  <label className={`${styles.label} ${styles.labelWide}`}>Confirm Password</label>
                  <div className={styles.inputWrap}>
                    <span className={`${styles.inputIcon} ${styles.emojiIcon}`}>🔑</span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={confirm}
                      required
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className={styles.input}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || !token} className={styles.submitButton}>
                  {loading ? <><span className={styles.spinner} />Saving...</> : "Reset Password →"}
                </button>
              </form>
              <div className={styles.backLinkWrap}>
                <Link href="/login" className={styles.mutedLink}>← Back to Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
