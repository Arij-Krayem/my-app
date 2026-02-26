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
          display: flex;
          width: 100%;
          max-width: 960px;
          min-height: 580px;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 48px rgba(80, 60, 200, 0.10), 0 2px 8px rgba(0,0,0,0.06);
        }

        /* ── Left: form panel ── */
        .form-panel {
          flex: 1;
          padding: 52px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 36px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
        }

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

        .social-btn:hover {
          border-color: #5b4af7;
          background: #f5f3ff;
        }

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

        .input:focus {
          border-color: #5b4af7;
          box-shadow: 0 0 0 3px rgba(91, 74, 247, 0.12);
        }

        .input.error { border-color: #ef4444; }

        .remember-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .checkbox {
          width: 17px;
          height: 17px;
          accent-color: #5b4af7;
          cursor: pointer;
        }

        .remember-label {
          font-size: 13px;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
        }

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

        .signup-row {
          text-align: center;
          font-size: 13px;
          color: #6b7280;
        }

        .signup-link {
          color: #5b4af7;
          font-weight: 700;
          text-decoration: none;
          margin-left: 4px;
        }

        .signup-link:hover { text-decoration: underline; }

        /* ── Right: feature panel ── */
        .feature-panel {
          width: 420px;
          flex-shrink: 0;
          background: #fff;
          border-left: 1.5px solid #f0f2f8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          gap: 28px;
          position: relative;
          overflow: hidden;
        }

        .feature-illustration {
          width: 220px;
          height: 200px;
          position: relative;
        }

        /* Whiteboard */
        .whiteboard {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 160px;
          height: 120px;
          background: #e8ecf8;
          border-radius: 8px;
          border: 2px solid #c7cde8;
        }

        .whiteboard-chart {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          bottom: 16px;
        }

        /* Tripod legs */
        .tripod {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 30px;
          background: #7a80a0;
          border-radius: 2px;
        }
        .tripod::before, .tripod::after {
          content: '';
          position: absolute;
          bottom: 0;
          width: 4px;
          height: 26px;
          background: #7a80a0;
          border-radius: 2px;
        }
        .tripod::before { transform-origin: bottom; transform: rotate(20deg); left: -14px; }
        .tripod::after { transform-origin: bottom; transform: rotate(-20deg); right: -14px; }

        /* QA bubbles */
        .bubble-q {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 48px;
          height: 48px;
          background: #7c6af7;
          border-radius: 10px 10px 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          box-shadow: 0 4px 12px rgba(124, 106, 247, 0.4);
          animation: float 3s ease-in-out infinite;
        }

        .bubble-a {
          position: absolute;
          top: 30px;
          right: 16px;
          width: 44px;
          height: 44px;
          background: #f7564a;
          border-radius: 10px 10px 0 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          box-shadow: 0 4px 12px rgba(247, 86, 74, 0.4);
          animation: float 3s ease-in-out infinite 1s;
        }

        /* Lightbulb */
        .lightbulb {
          position: absolute;
          bottom: 44px;
          right: 14px;
          font-size: 36px;
          animation: glow 2s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
        }

        /* Chart SVG line */
        .chart-line { animation: drawLine 2s ease forwards; stroke-dasharray: 200; stroke-dashoffset: 200; }

        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.9)); }
        }

        .feature-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e5e7eb;
          transition: background 0.3s;
        }

        .dot.active {
          background: #5b4af7;
          width: 24px;
          border-radius: 4px;
        }

        .feature-text {
          text-align: center;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .feature-desc {
          font-size: 13.5px;
          color: #6b7280;
          line-height: 1.65;
          max-width: 280px;
          margin: 0 auto;
        }

        .learn-btn {
          padding: 11px 28px;
          background: #5b4af7;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .learn-btn:hover { background: #4c3de0; }
        .learn-btn:active { transform: scale(0.98); }

        /* Responsive */
        @media (max-width: 720px) {
          .feature-panel { display: none; }
          .form-panel { padding: 40px 28px; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">

          {/* ── Left: Form ── */}
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

          {/* ── Right: Feature panel ── */}
          <div className="feature-panel">
            <div className="feature-illustration">
              {/* Q bubble */}
              <div className="bubble-q">Q</div>
              {/* A bubble */}
              <div className="bubble-a">A</div>
              {/* Whiteboard */}
              <div className="whiteboard">
                <div className="whiteboard-chart">
                  <svg width="100%" height="100%" viewBox="0 0 128 88">
                    <polyline
                      className="chart-line"
                      points="0,70 30,55 55,60 75,30 100,20 128,10"
                      fill="none"
                      stroke="#5b4af7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="75" cy="30" r="4" fill="#5b4af7" opacity="0.8"/>
                    <circle cx="128" cy="10" r="4" fill="#34D399" opacity="0.9"/>
                  </svg>
                </div>
              </div>
              {/* Tripod */}
              <div className="tripod" />
              {/* Lightbulb */}
              <div className="lightbulb">💡</div>
            </div>

            <div className="feature-dots">
              <div className="dot" />
              <div className="dot active" />
              <div className="dot" />
            </div>

            <div className="feature-text">
              <div className="feature-title">Feature Rich 2D Charts</div>
              <p className="feature-desc">
                Donec justo tortor, malesuada vitae faucibus ac,
                tristique sit amet massa. Aliquam dignissim nec
                felis quis imperdiet.
              </p>
            </div>

            <button className="learn-btn" type="button">Learn More</button>
          </div>

        </div>
      </div>
    </>
  );
}