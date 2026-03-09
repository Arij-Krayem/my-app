"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const MOCK_ALERTS = [
  { id: 1, campaign: "Summer Sale Campaign", metric: "ROAS",  current: "2.1",   threshold: "3.0",   severity: "CRITICAL", ago: "2h ago",  platform: "Google" },
  { id: 2, campaign: "Brand Awareness Q3",   metric: "CTR",   current: "1.2%",  threshold: "2.0%",  severity: "WARNING",  ago: "4h ago",  platform: "Meta"   },
  { id: 3, campaign: "Product Launch",       metric: "CPC",   current: "$3.45", threshold: "$2.50", severity: "WARNING",  ago: "6h ago",  platform: "Google" },
];

const KPI_CARDS = [
  { label: "Total Spend", value: "$24,582", change: "+12.4%", up: true,  icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>), grad: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.2)"  },
  { label: "ROAS",        value: "4.2x",    change: "+8.1%",  up: true,  icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>), grad: "linear-gradient(135deg,#5865f2,#818cf8)", glow: "rgba(88,101,242,0.2)"  },
  { label: "CTR",         value: "3.8%",    change: "-2.3%",  up: false, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>), grad: "linear-gradient(135deg,#8b5cf6,#a78bfa)", glow: "rgba(139,92,246,0.2)"  },
  { label: "CPC",         value: "$1.24",   change: "-5.2%",  up: false, icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>), grad: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.2)"  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [uploads, setUploads] = useState<{ id: string; fileName: string; platform: string; status: string; createdAt: string }[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (raw) setUser(JSON.parse(raw));
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/uploads?limit=3", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : []).then(d => setUploads(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

  const statusCfg = (s: string) => ({
    IMPORTED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)",  border: "rgba(63,185,80,0.25)"  },
    MAPPED:   { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
    PENDING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
    FAILED:   { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)"  },
  }[s] || { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" });

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>
            {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Here's your campaign performance overview for today.</p>
        </div>
        <Link href="/uploads/new" style={{ padding: "10px 18px", background: "linear-gradient(135deg,#5865f2,#818cf8)", borderRadius: "10px", color: "white", fontWeight: "600", fontSize: "13px", textDecoration: "none", boxShadow: "0 4px 14px rgba(88,101,242,0.35)", display: "flex", alignItems: "center", gap: "6px" }}>
          + New Upload
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {KPI_CARDS.map(k => (
          <div key={k.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", position: "relative", overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${k.glow}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: k.glow, filter: "blur(20px)", pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: k.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: `0 4px 12px ${k.glow}` }}>{k.icon}</div>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "3px 8px", borderRadius: "6px", background: k.up ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)", color: k.up ? "#3fb950" : "#f85149", border: `1px solid ${k.up ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)"}` }}>
                {k.up ? "▲" : "▼"} {k.change}
              </span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--t1)", marginBottom: "3px", fontVariantNumeric: "tabular-nums", position: "relative" }}>{k.value}</div>
            <div style={{ fontSize: "13px", color: "var(--t2)", position: "relative" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px" }}>
        {/* Alerts */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)" }}>Active Alerts</h2>
              <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: "rgba(248,81,73,0.12)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
                {MOCK_ALERTS.filter(a => a.severity === "CRITICAL").length} critical
              </span>
            </div>
            <Link href="/alerts" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none", fontWeight: "500" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MOCK_ALERTS.map(a => {
              const isCrit = a.severity === "CRITICAL";
              return (
                <div key={a.id} style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--bg)", borderLeft: `3px solid ${isCrit ? "#f85149" : "#d29922"}`, border: `1px solid ${isCrit ? "rgba(248,81,73,0.15)" : "rgba(210,153,34,0.15)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{a.campaign}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: isCrit ? "rgba(248,81,73,0.12)" : "rgba(210,153,34,0.12)", color: isCrit ? "#f85149" : "#d29922", border: `1px solid ${isCrit ? "rgba(248,81,73,0.25)" : "rgba(210,153,34,0.25)"}` }}>{a.severity}</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--t2)" }}>{a.metric}: <span style={{ color: isCrit ? "#f85149" : "#d29922", fontWeight: "700" }}>{a.current}</span> / {a.threshold}</span>
                    <span style={{ fontSize: "11px", color: a.platform === "Google" ? "#4285F4" : "#1877F2", fontWeight: "600" }}>{a.platform}</span>
                    <span style={{ fontSize: "11px", color: "var(--t3)", marginLeft: "auto" }}>{a.ago}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Platform split */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "16px" }}>Platform Split</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Google Ads", pct: 62, color: "#4285F4", spend: "$15,241" },
                { label: "Meta Ads",   pct: 38, color: "#1877F2", spend: "$9,341"  },
              ].map(p => (
                <div key={p.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: p.color }}>{p.label}</span>
                    <span style={{ fontSize: "13px", color: "var(--t2)" }}>{p.spend} · {p.pct}%</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)" }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: p.color, borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent uploads */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)" }}>Recent Uploads</h2>
              <Link href="/uploads" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none", fontWeight: "500" }}>View all →</Link>
            </div>
            {uploads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ color: "var(--t3)", marginBottom: "8px", display:"flex", justifyContent:"center" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "10px" }}>No uploads yet</p>
                <Link href="/uploads/new" style={{ fontSize: "12px", fontWeight: "600", color: "#5865f2", textDecoration: "none", padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(88,101,242,0.3)", background: "rgba(88,101,242,0.08)" }}>Upload first dataset →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {uploads.slice(0,4).map(u => {
                  const sc = statusCfg(u.status);
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "7px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", color: "white", background: u.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                        {u.platform === "GOOGLE" ? "G" : "f"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.fileName}</div>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", flexShrink: 0, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{u.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}