"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import styles from "../auth.module.css";

const registerSchema = z.object({
  name: z.string()
    .min(1, "Full name is required.")
    .min(4, "Full name must be at least 4 characters.")
    .regex(/^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u, "Name should only contain letters."),
  email: z.string()
    .min(1, "Email is required.")
    .min(6, "Email must be at least 6 characters.")
    .includes("@", { message: "Email must include @." })
    .email("Please enter a valid email address."),
  password: z.string()
    .min(1, "Password is required.")
    .min(6, "Password must be at least 6 characters."),
  confirm: z.string()
    .min(1, "Please confirm your password."),
}).refine(data => data.password === data.confirm, {
  message: "Passwords do not match.",
  path: ["confirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const nameVal = useWatch({ control, name: "name" }) ?? "";
  const emailVal = useWatch({ control, name: "email" }) ?? "";
  const confirmVal = useWatch({ control, name: "confirm" }) ?? "";

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    if (sessionStorage.getItem("access_token")) router.push("/dashboard");
  }, [router]);

  const onSubmit = async (values: RegisterForm) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
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

  const isValid = (name: keyof RegisterForm) => touchedFields[name] && !errors[name];
  const inputClass = (name: keyof RegisterForm, extraRight = false) => [
    styles.input,
    extraRight ? styles.inputWithAction : "",
    errors[name] ? styles.inputError : "",
    touchedFields[name] && !errors[name] ? styles.inputValid : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.page}>
      <div className={styles.orbPrimary} />
      <div className={styles.orbSecondary} />

      <div className={styles.panelWrap}>
        <div className={styles.panelHeader}>
          <div className={styles.brandMark}>V</div>
          <h1 className={styles.heading}>Create account</h1>
          <p className={styles.subheading}>Start monitoring your ad campaigns</p>
        </div>

        <div className={styles.card}>
          {serverError && (
            <div className={`${styles.message} ${styles.messageError}`}>
              <ErrIcon />{serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><UserIcon /></span>
                <input {...register("name")} type="text" placeholder="John Doe" autoComplete="name" className={inputClass("name")} />
                {isValid("name") && nameVal && (
                  <span className={styles.validIcon}><CheckIcon /></span>
                )}
              </div>
              {errors.name && <p className={styles.errorText}><ErrIcon />{errors.name.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email <span className={styles.required}>*</span></label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><MailIcon /></span>
                <input {...register("email")} type="email" placeholder="you@visioad.com" autoComplete="email" className={inputClass("email")} />
                {isValid("email") && emailVal && (
                  <span className={styles.validIcon}><CheckIcon /></span>
                )}
              </div>
              {errors.email && <p className={styles.errorText}><ErrIcon />{errors.email.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password <span className={styles.required}>*</span></label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><LockIcon /></span>
                <input {...register("password")} type={showPw ? "text" : "password"} placeholder="Min. 6 characters" autoComplete="new-password" className={inputClass("password", true)} />
                <button type="button" onClick={() => setShowPw(!showPw)} className={styles.passwordToggle}>
                  {showPw ? <EyeOn /> : <EyeOff />}
                </button>
              </div>
              {errors.password && <p className={styles.errorText}><ErrIcon />{errors.password.message}</p>}
            </div>

            <div className={styles.formGroupLg}>
              <label className={styles.label}>Confirm Password <span className={styles.required}>*</span></label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><LockIcon /></span>
                <input {...register("confirm")} type={showPw ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password" className={inputClass("confirm")} />
                {isValid("confirm") && confirmVal && (
                  <span className={styles.validIcon}><CheckIcon /></span>
                )}
              </div>
              {errors.confirm && <p className={styles.errorText}><ErrIcon />{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? <><span className={styles.spinner} />Creating...</> : "Create Account →"}
            </button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>HAVE AN ACCOUNT?</span>
            <div className={styles.dividerLine} />
          </div>

          <Link href="/login" className={styles.secondaryLink}>
            Sign in instead
          </Link>
        </div>

        <p className={styles.footerNote}>
          © 2026 VisioAd · Full-Service Brand Advertising Agency
        </p>
      </div>
    </div>
  );
}
