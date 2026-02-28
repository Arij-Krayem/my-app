"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Invalid credentials");
        return;
      }
      const { accessToken } = await res.json();
      await login(accessToken);
      router.replace("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #f0f2f8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Manrope', sans-serif;
          padding: 24px;
        }

        .login-card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 48px rgba(80, 60, 200, 0.10), 0 2px 8px rgba(0,0,0,0.06);
        }

        .form-panel {
          padding: 52px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 36px;
        }

        .logo-icon { width: 32px; height: 32px; }

        .logo-text {
          font-size: 20px;
          font-weight: 800;
          color: #5b4af7;
          letter-spacing: -0.3px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
          margin-bottom: 28px;
          line-height: 1.2;
        }

        .social-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .social-btn:hover { border-color: #5b4af7; background: #f5f3ff; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #9ca3af;
          font-size: 13px;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
        }

        .field-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .forgot-link {
          font-size: 13px;
          font-weight: 600;
          color: #5b4af7;
          text-decoration: none;
        }
        .forgot-link:hover { text-decoration: underline; }

        .input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          color: #111827;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .input::placeholder { color: #9ca3af; }
        .input:focus { border-color: #5b4af7; box-shadow: 0 0 0 3px rgba(91,74,247,0.12); }
        .input.error { border-color: #ef4444; }

        .remember-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .checkbox { width: 17px; height: 17px; accent-color: #5b4af7; cursor: pointer; }

        .remember-label { font-size: 13px; color: #374151; font-weight: 500; cursor: pointer; }

        .error-msg {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 13px;
          padding: 10px 12px;
          margin-bottom: 16px;
        }

        .submit-btn {
          width: 100%;
          padding: 13px;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Manrope', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          margin-bottom: 20px;
        }

        .submit-btn:hover:not(:disabled) { background: #1f2937; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .signup-row { text-align: center; font-size: 13px; color: #6b7280; }

        .signup-link {
          color: #5b4af7;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }
        .signup-link:hover { text-decoration: underline; }

        @media (max-width: 520px) {
          .form-panel { padding: 40px 28px; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <div className="form-panel">
            <div className="logo">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#5b4af7"/>
                <path d="M8 22L14 12l5 8 3-5 4 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="logo-text">Visioad</span>
            </div>

            <h1 className="form-title">Let's get you<br />signed in</h1>

            <div className="social-row">
              <button className="social-btn" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
              <button className="social-btn" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
            </div>

            <div className="divider">Or sign in with email</div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <div>
                  <div className="field-label">Email Address</div>
                  <input
                    className={`input${error ? " error" : ""}`}
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <div className="field-label">
                    Password
                    <a href="/forgot-password" className="forgot-link">Forgot Password?</a>
                  </div>
                  <input
                    className={`input${error ? " error" : ""}`}
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="remember-row">
                <input
                  id="remember"
                  type="checkbox"
                  className="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <label htmlFor="remember" className="remember-label">Keep me logged in</label>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div className="signup-row">
              Don't have an account yet?
              <a href="/register" className="signup-link">Sign Up Now</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}