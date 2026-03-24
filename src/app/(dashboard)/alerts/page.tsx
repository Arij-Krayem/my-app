"use client";
import { useState, useEffect, useCallback } from "react";

type Status   = "OPEN" | "ACK" | "RESOLVED";
type Severity = "CRITICAL" | "WARNING";

interface AlertRule {
  metricKey: string;
  operator:  string;
  threshold: number;
  severity:  Severity;
}

interface Alert {
  id:        string;
  brandId:   string;
  ruleId:    string | null;
  status:    Status;
  message:   string;
  createdAt: string;
  rule?:     AlertRule | null;
  brand?:    { name: string };
}

const TABS: { key: "ALL" | Status; label: string }[] = [
  { key: "ALL",      label: "All"          },
  { key: "OPEN",     label: "Open"         },
  { key: "ACK",      label: "Acknowledged" },
  { key: "RESOLVED", label: "Resolved"     },
];

const SEV_CFG: Record<Severity, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)"  },
  WARNING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
};
const STA_CFG: Record<Status, { color: string; bg: string; border: string }> = {
  OPEN:     { color: "#5865f2", bg: "rgba(88,101,242,0.1)",  border: "rgba(88,101,242,0.25)"  },
  ACK:      { color: "#d29922", bg: "rgba(210,153,34,0.1)",  border: "rgba(210,153,34,0.25)"  },
  RESOLVED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)",   border: "rgba(63,185,80,0.25)"   },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getSeverity(alert: Alert): Severity {
  if (alert.rule?.severity) return alert.rule.severity as Severity;
  if (alert.message.toLowerCase().includes("critical")) return "CRITICAL";
  return "WARNING";
}

export default function AlertsPage() {
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState<"ALL" | Status>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alerts", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load alerts");
      const data = await res.json();
      setAlerts(data.items ?? []);
    } catch {
      setError("Could not load alerts. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch {
      setError("Failed to update alert status.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdating(null);
    }
  }

  const visible = tab === "ALL" ? alerts : alerts.filter(a => a.status === tab);
  const counts  = {
    OPEN:     alerts.filter(a => a.status === "OPEN").length,
    CRITICAL: alerts.filter(a => getSeverity(a) === "CRITICAL" && a.status === "OPEN").length,
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "16px", flexWrap: "wrap", padding: "18px 20px", borderRadius: "16px", background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,248,255,0.94) 100%)", border: "1px solid var(--border)" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Alert center</p>
          <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.6 }}>Monitor and manage campaign performance alerts from one place.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          <button onClick={loadAlerts}
            style={{ padding: "8px 16px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)", color: "var(--t2)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.25)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#f85149", fontSize: "14px" }}>
          ✗ {error}
        </div>
      )}

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

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Loading alerts…</p>
        </div>

      /* Empty state */
      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <div style={{ color: "var(--success)", display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>
            {alerts.length === 0 ? "No alerts yet" : "All clear!"}
          </p>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>
            {alerts.length === 0
              ? "Create alert rules in the Guardrails page to start monitoring your campaigns."
              : "No alerts in this category."}
          </p>
        </div>

      /* Alert cards */
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visible.map(a => {
            const severity = getSeverity(a);
            const sv = SEV_CFG[severity];
            const st = STA_CFG[a.status];
            const isUpdating = updating === a.id;

            return (
              <div key={a.id} style={{
                background: "var(--card)", border: `1px solid var(--border)`,
                borderLeft: `3px solid ${sv.color}`,
                borderRadius: "14px", padding: "20px 22px",
                display: "flex", alignItems: "center", gap: "20px",
                transition: "transform 0.15s, box-shadow 0.15s",
                opacity: isUpdating ? 0.6 : 1,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {/* Severity dot */}
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sv.color, flexShrink: 0, boxShadow: `0 0 8px ${sv.color}` }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>
                      {a.rule?.metricKey?.toUpperCase() ?? "Alert"}
                    </span>
                    {a.brand?.name && (
                      <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "5px", background: "rgba(88,101,242,0.08)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)" }}>
                        {a.brand.name}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: sv.bg, color: sv.color, border: `1px solid ${sv.border}` }}>
                      {severity}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "5px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {a.status}
                    </span>
                  </div>

                  <p style={{ fontSize: "13px", color: "var(--t2)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {a.message}
                  </p>

                  {a.rule && (
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px" }}>METRIC</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{a.rule.metricKey}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px" }}>CONDITION</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{a.rule.operator} {a.rule.threshold}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "8px" }}>{timeAgo(a.createdAt)}</div>
                </div>

                {/* Actions */}
                {a.status !== "RESOLVED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                    {a.status === "OPEN" && (
                      <button onClick={() => updateStatus(a.id, "ACK")} disabled={isUpdating}
                        style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid rgba(210,153,34,0.4)", background: "rgba(210,153,34,0.08)", color: "#d29922", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        {isUpdating ? "…" : "Acknowledge"}
                      </button>
                    )}
                    <button onClick={() => updateStatus(a.id, "RESOLVED")} disabled={isUpdating}
                      style={{ padding: "8px 16px", borderRadius: "9px", border: "1px solid rgba(63,185,80,0.4)", background: "rgba(63,185,80,0.08)", color: "#3fb950", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                      {isUpdating ? "…" : "Resolve"}
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
