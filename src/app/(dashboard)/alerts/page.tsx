"use client";
import { useState, useEffect, useCallback } from "react";

type Status = "OPEN" | "ACK" | "RESOLVED";
type Severity = "CRITICAL" | "WARNING";

interface AlertRule {
  metricKey: string;
  operator: string;
  threshold: number;
  severity: Severity;
}

interface Alert {
  id: string;
  brandId: string;
  ruleId: string | null;
  status: Status;
  message: string;
  createdAt: string;
  rule?: AlertRule | null;
  brand?: { name: string };
}

const TABS: { key: "ALL" | Status; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "ACK", label: "Acknowledged" },
  { key: "RESOLVED", label: "Resolved" },
];

const SEV_CFG: Record<Severity, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)" },
  WARNING: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
};
const STA_CFG: Record<Status, { color: string; bg: string; border: string }> = {
  OPEN: { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
  ACK: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  RESOLVED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.25)" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"ALL" | Status>("ALL");
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

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">ALERTS</div>
          <h1 className="dashboard-title">Alert center</h1>
          <p className="dashboard-subtitle">Monitor active issues, triage notifications, and resolve campaign risks quickly.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <button onClick={loadAlerts} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && <div className="dashboard-banner-error">{error}</div>}

      <div className="dashboard-pill-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`dashboard-pill-tab ${tab === t.key ? "dashboard-pill-tab-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dashboard-card" style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Loading alerts...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="dashboard-card dashboard-empty-state">
          <div className="dashboard-empty-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="dashboard-empty-title">No alerts yet</div>
          <div className="dashboard-empty-subtitle">Create guardrail rules to start monitoring metrics and receiving alert notifications.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visible.map(a => {
            const severity = getSeverity(a);
            const sv = SEV_CFG[severity];
            const st = STA_CFG[a.status];
            const isUpdating = updating === a.id;

            return (
              <div key={a.id} className="dashboard-card" style={{ borderLeft: `4px solid ${sv.color}`, padding: "20px 22px", display: "flex", alignItems: "center", gap: "20px", opacity: isUpdating ? 0.6 : 1 }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sv.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--t1)" }}>{a.rule?.metricKey?.toUpperCase() ?? "Alert"}</span>
                    {a.brand?.name && (
                      <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", background: "#eef2ff", color: "#5865f2" }}>
                        {a.brand.name}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "999px", background: sv.bg, color: sv.color, border: `1px solid ${sv.border}` }}>{severity}</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{a.status}</span>
                  </div>

                  <p style={{ fontSize: "14px", color: "var(--t2)", margin: "0 0 10px", lineHeight: 1.6 }}>{a.message}</p>

                  {a.rule && (
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.08em" }}>Metric</span>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>{a.rule.metricKey}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--t3)", display: "block", marginBottom: "2px", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.08em" }}>Condition</span>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>{a.rule.operator} {a.rule.threshold}</span>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: "12px", color: "var(--t3)", marginTop: "10px" }}>{timeAgo(a.createdAt)}</div>
                </div>

                {a.status !== "RESOLVED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                    {a.status === "OPEN" && (
                      <button onClick={() => updateStatus(a.id, "ACK")} disabled={isUpdating} className="btn-secondary" style={{ padding: "9px 14px", color: "#d29922", borderColor: "rgba(210,153,34,0.25)" }}>
                        {isUpdating ? "..." : "Acknowledge"}
                      </button>
                    )}
                    <button onClick={() => updateStatus(a.id, "RESOLVED")} disabled={isUpdating} className="btn-secondary" style={{ padding: "9px 14px", color: "#16a34a", borderColor: "rgba(22,163,74,0.25)" }}>
                      {isUpdating ? "..." : "Resolve"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
