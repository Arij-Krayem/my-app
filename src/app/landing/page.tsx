"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--t1)", fontFamily: "'Outfit', sans-serif", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #5865f2, #818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", color: "white", fontSize: "16px",
            boxShadow: "0 4px 14px rgba(88,101,242,0.4)",
          }}>V</div>
          <span style={{ fontWeight: "700", fontSize: "18px", color: "var(--t1)" }}>
            VISIO<span style={{ color: "#5865f2" }}>AD</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/login" style={{
            padding: "9px 20px", borderRadius: "10px",
            border: "1px solid var(--border)", color: "var(--t1)",
            fontWeight: "500", fontSize: "14px", textDecoration: "none",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#5865f2"; (e.currentTarget as HTMLElement).style.color = "#5865f2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; }}
          >Sign In</Link>
          <Link href="/register" style={{
            padding: "9px 20px", borderRadius: "10px",
            background: "linear-gradient(135deg, #5865f2, #818cf8)",
            color: "white", fontWeight: "600", fontSize: "14px",
            textDecoration: "none", boxShadow: "0 4px 14px rgba(88,101,242,0.35)",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(88,101,242,0.45)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(88,101,242,0.35)"; }}
          >Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px", textAlign: "center", position: "relative",
      }}>
        {/* Glow blobs */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(88,101,242,0.15) 0%, transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", animation: "fadeUp 0.6s ease both" }}>

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 76px)", fontWeight: "800",
            lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-1px",
          }}>
            Stop Guessing.{" "}
            <span style={{ background: "linear-gradient(135deg, #5865f2, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Start Monitoring.
            </span>
          </h1>

          <p style={{
            fontSize: "18px", color: "var(--t2)", lineHeight: 1.7,
            maxWidth: "580px", margin: "0 auto 40px",
          }}>
            Centralized Google & Meta Ads monitoring with intelligent anomaly detection.
            Stop budget-bleeding campaigns before they impact your bottom line.
          </p>

          {/* Single centered CTA */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "64px" }}>
            <Link href="/register" style={{
              padding: "14px 32px", borderRadius: "12px",
              background: "linear-gradient(135deg, #5865f2, #818cf8)",
              color: "white", fontWeight: "700", fontSize: "16px",
              textDecoration: "none", boxShadow: "0 6px 20px rgba(88,101,242,0.4)",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 28px rgba(88,101,242,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(88,101,242,0.4)"; }}
            >
              Get Started Free →
            </Link>
          </div>

          {/* Mock Dashboard Preview */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: "20px", padding: "24px", maxWidth: "860px",
            margin: "0 auto", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(88,101,242,0.1)",
            textAlign: "left",
          }}>
            {/* Mock topbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontWeight: "700", fontSize: "15px", color: "var(--t1)" }}>Performance Overview</span>
              <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "6px", background: "rgba(63,185,80,0.15)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)" }}>● LIVE</span>
            </div>

            {/* Mock KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
              {[
                { label: "TOTAL SPEND", value: "$24,582", change: "↑ 12.4%", up: true },
                { label: "ROAS", value: "4.2x", change: "↑ 8.1%", up: true },
                { label: "CTR", value: "3.8%", change: "↓ 2.3%", up: false },
                { label: "CPC", value: "$1.24", change: "↓ 5.2%", up: false },
              ].map(k => (
                <div key={k.label} style={{ padding: "14px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "600", letterSpacing: "0.5px", marginBottom: "6px" }}>{k.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>{k.value}</div>
                  <div style={{ fontSize: "11px", color: k.up ? "#3fb950" : "#f85149", fontWeight: "600" }}>{k.change} vs last period</div>
                </div>
              ))}
            </div>

            {/* Mock alerts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { name: "Summer Sale Campaign", badge: "CRITICAL", color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.3)" },
                { name: "Brand Awareness Q3", badge: "WARNING", color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.3)" },
              ].map(a => (
                <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "var(--t1)", fontWeight: "500" }}>{a.name}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "5px", background: a.bg, color: a.color, border: `1px solid ${a.border}` }}>{a.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 48px", background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#5865f2", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>WHY VISIOAD</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "var(--t1)", marginBottom: "16px" }}>Everything you need to monitor performance</h2>
            <p style={{ fontSize: "16px", color: "var(--t2)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>From data ingestion to anomaly alerts — all in one platform.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              {
                icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>), color: "#5865f2", bg: "rgba(88,101,242,0.12)",
                title: "KPI Monitoring",
                desc: "Track ROAS, CTR, CPC, and CAC in real-time across all your Google & Meta campaigns. Visualized with Recharts for maximum clarity.",
              },
              {
                icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>), color: "#3fb950", bg: "rgba(63,185,80,0.12)",
                title: "Python Anomaly Detection",
                desc: "Our Python-powered engine analyzes your CSV data to identify performance drifts and automatically flag budget-bleeding campaigns before they escalate.",
              },
              {
                icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>), color: "#d29922", bg: "rgba(210,153,34,0.12)",
                title: "Instant Alerts",
                desc: "Set custom guardrails for any KPI. Get notified the moment a campaign drifts out of bounds with severity-ranked alerts.",
              },
            ].map(f => (
              <div key={f.title} style={{
                padding: "32px", borderRadius: "16px",
                background: "var(--card)", border: "1px solid var(--border)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "20px", border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", marginBottom: "12px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#5865f2", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "12px" }}>THE PROCESS</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "800", color: "var(--t1)", marginBottom: "60px" }}>How it works</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px", position: "relative" }}>
            <div style={{ position: "absolute", top: "28px", left: "calc(16.67% + 16px)", right: "calc(16.67% + 16px)", height: "2px", background: "linear-gradient(90deg, #5865f2, #818cf8)", opacity: 0.3, zIndex: 0 }} />

            {[
              { n: "1", title: "Upload your data", desc: "Export your Google Ads or Meta CSV data and upload it directly to VisioAd in seconds." },
              { n: "2", title: "Map your columns", desc: "Our intelligent mapper helps you align CSV headers to our unified schema with one click." },
              { n: "3", title: "Get alerted instantly", desc: "Python analyzes your data and sends real-time alerts when anomalies are detected in your campaigns." },
            ].map(s => (
              <div key={s.n} style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #5865f2, #818cf8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: "800", color: "white",
                  margin: "0 auto 20px",
                  boxShadow: "0 4px 20px rgba(88,101,242,0.4)",
                }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--t1)", marginBottom: "10px" }}>{s.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section style={{ padding: "60px 48px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--t2)", fontWeight: "600", marginBottom: "24px", textTransform: "uppercase", letterSpacing: "1px" }}>Works with your favorite platforms</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Google Ads", color: "#4285F4", bg: "rgba(66,133,244,0.1)", border: "rgba(66,133,244,0.3)", icon: "G" },
              { label: "Meta Ads", color: "#1877F2", bg: "rgba(24,119,242,0.1)", border: "rgba(24,119,242,0.3)", icon: "f" },
            ].map(p => (
              <div key={p.label} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 28px", borderRadius: "12px",
                background: p.bg, border: `1px solid ${p.border}`,
                fontWeight: "700", fontSize: "15px", color: p.color,
              }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "8px", background: p.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px" }}>{p.icon}</span>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 48px" }}>
        <div style={{
          maxWidth: "700px", margin: "0 auto", textAlign: "center",
          padding: "60px 48px", borderRadius: "24px",
          background: "linear-gradient(135deg, rgba(88,101,242,0.15), rgba(139,92,246,0.1))",
          border: "1px solid rgba(88,101,242,0.25)",
          boxShadow: "0 0 60px rgba(88,101,242,0.1)",
        }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "800", color: "var(--t1)", marginBottom: "16px" }}>
            Ready to stop budget waste?
          </h2>
          <p style={{ fontSize: "16px", color: "var(--t2)", marginBottom: "32px", lineHeight: 1.6 }}>
            Join your team on VisioAd and start catching anomalies before they cost you.
          </p>
          <Link href="/register" style={{
            display: "inline-block", padding: "14px 36px", borderRadius: "12px",
            background: "linear-gradient(135deg, #5865f2, #818cf8)",
            color: "white", fontWeight: "700", fontSize: "16px",
            textDecoration: "none", boxShadow: "0 6px 20px rgba(88,101,242,0.4)",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 28px rgba(88,101,242,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(88,101,242,0.4)"; }}
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 48px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #5865f2, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white", fontSize: "13px" }}>V</div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--t1)" }}>VisioAd</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>Full-Service Brand Advertising Agency</div>
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(170px, 1fr))",
            gap: "8px 18px",
            maxWidth: "470px",
            flex: "1 1 420px",
            color: "var(--t2)",
            fontSize: "12px",
          }}>
            <div style={{ gridColumn: "1 / -1", fontSize: "12px", fontWeight: "700", color: "var(--t1)", letterSpacing: "0.2px" }}>Contact Us</div>
            {[
              {
                icon: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.5 2.7 3.8 6 3.8 10S14.5 19.3 12 22m0-20c-2.5 2.7-3.8 6-3.8 10S9.5 19.3 12 22M2 12h20" />,
                label: "www.visioad.com",
                href: "https://www.visioad.com",
              },
              {
                icon: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />,
                label: "+216 31 439 350",
                href: "tel:+21631439350",
              },
              {
                icon: <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 3-10 6L2 7" />,
                label: "info@visioad.com",
                href: "mailto:info@visioad.com",
              },
              {
                icon: <><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>,
                label: "Immeuble Centre Ibrahim, Av. Habib Bourguiba, Sousse 4000",
              },
            ].map(item => {
              const content = (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: "1px", color: "#5865f2" }}>
                    {item.icon}
                  </svg>
                  <span>{item.label}</span>
                </>
              );

              return item.href ? (
                <a key={item.label} href={item.href} style={{ display: "flex", alignItems: "flex-start", gap: "7px", color: "var(--t2)", lineHeight: 1.45, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5865f2"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t2)"}
                >
                  {content}
                </a>
              ) : (
                <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "7px", lineHeight: 1.45 }}>
                  {content}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: "14px", color: "var(--t2)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5865f2"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t2)"}
            >Login</Link>
            <Link href="/register" style={{ fontSize: "14px", color: "var(--t2)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5865f2"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--t2)"}
            >Register</Link>
          </div>
        </div>
        <div style={{ maxWidth: "1100px", margin: "20px auto 0", paddingTop: "20px", borderTop: "1px solid var(--border)", textAlign: "center", fontSize: "12px", color: "var(--t3)" }}>
          © 2026 VisioAd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
