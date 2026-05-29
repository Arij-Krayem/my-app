"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setEmail(trimmedEmail);
    setError("");
    setLoading(true);
    try { 
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }), // Sends the email to our backend API
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
    <div className={styles.page}>
      <div className={`${styles.orbPrimary} ${styles.orbAltPrimary}`} />
      <div className={styles.orbSecondary} />

      <div className={styles.panelStatic}>
        <div className={styles.panelHeader}>
          <div className={styles.brandMarkSmall}>V</div>
          <h1 className={styles.heading}>Forgot password?</h1>
          <p className={styles.subheading}>Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <div className={`${styles.card} ${styles.cardStrong}`}>
          {sent ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✉</div>
              <h2 className={styles.successTitle}>Check your inbox</h2>
              <p className={styles.successText}>
                We sent a password reset link to <strong className={styles.strongText}>{email}</strong>. Check your spam folder if you don&apos;t see it.
              </p>
              <Link href="/login" className={styles.primaryLinkFull}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className={`${styles.message} ${styles.messageError}`}>
                  ⚠ {error}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className={styles.formGroupXL}>
                  <label className={`${styles.label} ${styles.labelWide}`}>Email Address</label>
                  <div className={styles.inputWrap}>
                    <span className={`${styles.inputIcon} ${styles.emojiIcon}`}>✉</span>
                    <input
                      type="email"
                      value={email}
                      required
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@visioad.com"
                      className={styles.input}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className={styles.submitButton}>
                  {loading ? <><span className={styles.spinner} />Sending...</> : "Send Reset Link →"}
                </button>
              </form>
              <div className={styles.backLinkWrap}>
                <Link href="/login" className={styles.mutedLink}>
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
        <p className={styles.footerNote}>© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
      </div>
    </div>
  );
}
