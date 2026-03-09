"use client";
import { useState } from "react";

type Status   = "OPEN" | "ACK" | "RESOLVED";
type Severity = "CRITICAL" | "WARNING";

interface Alert {
  id: number; campaign: string; metric: string;
  current: string; threshold: string;
  severity: Severity; status: Status; ago: string; platform: string;
}

const INIT: Alert[] = [
  { id: 1, campaign: "Summer Sale Campaign",  metric: "ROAS",  current: "2.1",     threshold: "3.0",     severity: "CRITICAL", status: "OPEN",     ago: "2h ago",  platform: "Google" },
  { id: 2, campaign: "Brand Awareness Q3",    metric: "CTR",   current: "1.2%",    threshold: "2.0%",    severity: "WARNING",  status: "OPEN",     ago: "4h ago",  platform: "Meta"   },
  { id: 3, campaign: "Product Launch",        metric: "CPC",   current: "$3.45",   threshold: "$2.50",   severity: "WARNING",  status: "ACK",      ago: "6h ago",  platform: "Google" },
  { id: 4, campaign: "Holiday Special",       metric: "Spend", current: "$15,000", threshold: "$10,000", severity: "CRITICAL", status: "RESOLVED", ago: "8h ago",  platform: "Meta"   },
  { id: 5, campaign: "Retargeting EU",        metric: "CTR",   current: "0.4%",    threshold: "1.0%",    severity: "WARNING",  status: "OPEN",     ago: "12h ago", platform: "Google" },
];

const TABS: { key: "ALL" | Status; label: string }[] = [
  { key: "ALL",      label: "All"      },
  { key: "OPEN",     label: "Open"     },
  { key: "ACK",      label: "Acknowledged" },
  { key: "RESOLVED", label: "Resolved" },
];

const SEV_CFG = {
  CRITICAL: { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)",  dot: "#f85149" },
  WARNING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)", dot: "#d29922" },
};
const STA_CFG: Record<Status, { color: string; bg: string; border: string }> = {
  OPEN:     { color: "#5865f2", bg: "rgba(88,101,242,0.1)",  border: "rgba(88,101,242,0.25)"  },
  ACK:      { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  RESOLVED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)",   border: "rgba(63,185,80,0.25)"   },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INIT);
  const [tab, setTab]       = useState<"ALL" | Status>("ALL");

  const update = (id: number, status: Status) =>
    setAlerts(a => a.map(x => x.id === id ? { ...x, status } : x));

  const visible = tab === "ALL" ? alerts : alerts.filter(a => a.status === tab);
  const counts  = { OPEN: alerts.filter(a => a.status === "OPEN").length, CRITICAL: alerts.filter(a => a.severity === "CRITICAL" && a.status === "OPEN").length };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Alerts</h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Monitor and manage campaign performance alerts</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {counts.CRITICAL > 0 && (
            <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(248,81,73,0.1)", border: "1px solid rgba(248,81,73,0.25)", fontSize: "13px", fontWeight: "700", color: "#f85149", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f85149", display: "inline-block" }} />
              {counts.CRITICAL} Critical
            </div>
          )}
          {counts.OPEN > 0 && (
            <div style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(88,101,242,0.1)", border: "1px solid rgba(88,101,242,0.25)", fontSize: "13px", fontWeight: "700", color: "#5865f2" }}>
              {counts.OPEN} Open
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: "600", fontFamily: "inherit", transition: "all 0.15s",
            background: tab === t.key ? "linear-gradient(135deg,#5865f2,#818cf8)" : "transparent",
            color: tab === t.key ? "white" : "var(--t2)",
            boxShadow: tab === t.key ? "0 2px 10px rgba(88,101,242,0.3)" : "none",
          }}>
            {t.label}
            {t.key !== "ALL" && alerts.filter(a => a.status === t.key).length > 0 && (
              <span style={{ marginLeft: "6px", fontSize: "11px", opacity: 0.8 }}>
                ({alerts.filter(a => a.status === t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <div style={{ color:"var(--success)", display:"flex", justifyContent:"center", marginBottom:"12px" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>All clear!</p>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>No alerts in this category.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visible.map(a => {
            const sv = SEV_CFG[a.severity];
            const st = STA_CFG[a.status];
            return (
              <div key={a.id} style={{
                background: "var(--card)", border: `1px solid var(--border)`,
                borderLeft: `3px solid ${sv.color}`,
                borderRadius: "14px", padding: "20px 22px",
                display: "flex", alignItems: "center", gap: "20px",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {/* Left: severity dot */}
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sv.color, flexShrink: 0, boxShadow: `0 0 8px ${sv.color}` }} />

                {/* Center: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>{a.campaign}</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: sv.bg, color: sv.color, border: `1px solid ${sv.border}` }}>{a.severity}</span>
                    <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "5px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{a.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px" }}>METRIC</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{a.metric}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px" }}>CURRENT</span>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: sv.color }}>{a.current}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px" }}>THRESHOLD</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t2)" }}>{a.threshold}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px" }}>PLATFORM</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: a.platform === "Google" ? "#4285F4" : "#1877F2" }}>{a.platform}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "8px" }}>{a.ago}</div>
                </div>

                {/* Right: actions */}
                {a.status !== "RESOLVED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                    {a.status === "OPEN" && (
                      <button onClick={() => update(a.id, "ACK")} style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid rgba(210,153,34,0.4)", background: "rgba(210,153,34,0.08)", color: "#d29922", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                        Acknowledge
                      </button>
                    )}
                    <button onClick={() => update(a.id, "RESOLVED")} style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid rgba(63,185,80,0.4)", background: "rgba(63,185,80,0.08)", color: "#3fb950", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}