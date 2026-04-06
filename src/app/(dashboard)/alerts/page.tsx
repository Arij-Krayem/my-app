"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import {
  cardStyle,
  emptyIconWrapStyle,
  emptyStateWrapStyle,
  emptySubtitleStyle,
  emptyTitleStyle,
  pageEyebrowStyle,
  pageSubtitleStyle,
  pageTitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  pillStyle,
} from "@/components/dashboard/designSystem";

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
  CRITICAL: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.22)" },
  WARNING: { color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)" },
};

const STA_CFG: Record<Status, { color: string; bg: string; border: string }> = {
  OPEN: { color: "#4f46e5", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.22)" },
  ACK: { color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)" },
  RESOLVED: { color: "#16a34a", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.22)" },
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
  if (alert.rule?.severity) return alert.rule.severity;
  if (alert.message.toLowerCase().includes("critical")) return "CRITICAL";
  return "WARNING";
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"ALL" | Status>("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ items?: Alert[] }>("/api/alerts");
      console.log("[alerts] response", data);
      setAlerts(data.items ?? []);
    } catch (fetchError) {
      console.error("[alerts] Failed to load alerts", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Could not load alerts. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    try {
      await apiFetch(`/api/alerts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setAlerts((previous) => previous.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (fetchError) {
      console.error("[alerts] Failed to update alert", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to update alert status.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdating(null);
    }
  }

  const visible = tab === "ALL" ? alerts : alerts.filter((alert) => alert.status === tab);
  const counts = {
    open: alerts.filter((alert) => alert.status === "OPEN").length,
    critical: alerts.filter((alert) => getSeverity(alert) === "CRITICAL" && alert.status === "OPEN").length,
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={pageEyebrowStyle}>Alerts</div>
          <h1 style={pageTitleStyle}>Alert center</h1>
          <p style={pageSubtitleStyle}>Monitor active issues, triage notifications, and resolve campaign risks quickly.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {counts.critical > 0 && <div style={pillStyle("#ef4444", "rgba(239,68,68,0.1)", "rgba(239,68,68,0.22)")}>{counts.critical} Critical</div>}
          {counts.open > 0 && <div style={pillStyle("#4f46e5", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.22)")}>{counts.open} Open</div>}
          <button type="button" onClick={() => void loadAlerts()} style={secondaryButtonStyle}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 16,
            padding: "14px 16px",
            borderColor: "rgba(239,68,68,0.22)",
            background: "rgba(239,68,68,0.06)",
            color: "#dc2626",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ ...cardStyle, display: "flex", gap: 4, marginBottom: 20, padding: 4, width: "fit-content", boxShadow: "none" }}>
        {TABS.map((item) => {
          const active = tab === item.key;
          const count = item.key === "ALL" ? alerts.length : alerts.filter((alert) => alert.status === item.key).length;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: active ? "rgba(99,102,241,0.1)" : "transparent",
                color: active ? "#4f46e5" : "#64748b",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {item.label}
              {count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={emptyStateWrapStyle}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.12)", borderTopColor: "#6366F1", animation: "spin 0.8s linear infinite" }} />
          <p style={{ ...emptySubtitleStyle, marginTop: 18 }}>Loading alerts...</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={emptyStateWrapStyle}>
          <div style={emptyIconWrapStyle}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 style={emptyTitleStyle}>{alerts.length === 0 ? "No alerts yet" : "All clear"}</h2>
          <p style={emptySubtitleStyle}>
            {alerts.length === 0
              ? "Create guardrail rules to start monitoring metrics and receiving alert notifications."
              : "There are no alerts in this category right now."}
          </p>
          {alerts.length === 0 && (
            <Link href="/guardrails" style={{ ...primaryButtonStyle, marginTop: 20 }}>
              Create your first rule
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {visible.map((alert) => {
            const severity = getSeverity(alert);
            const sev = SEV_CFG[severity];
            const sta = STA_CFG[alert.status];
            const isUpdating = updating === alert.id;

            return (
              <div
                key={alert.id}
                style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${sev.color}`,
                  padding: "20px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: sev.color, boxShadow: `0 0 8px ${sev.color}` }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <span style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>
                      {alert.rule?.metricKey?.toUpperCase() ?? "Alert"}
                    </span>
                    {alert.brand?.name && (
                      <span style={pillStyle("#4f46e5", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.2)")}>
                        {alert.brand.name}
                      </span>
                    )}
                    <span style={pillStyle(sev.color, sev.bg, sev.border)}>{severity}</span>
                    <span style={pillStyle(sta.color, sta.bg, sta.border)}>{alert.status}</span>
                  </div>

                  <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{alert.message}</p>

                  {alert.rule && (
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                          Metric
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>{alert.rule.metricKey}</div>
                      </div>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                          Condition
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>
                          {alert.rule.operator} {alert.rule.threshold}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 10, color: "#94a3b8", fontSize: 12 }}>{timeAgo(alert.createdAt)}</div>
                </div>

                {alert.status !== "RESOLVED" && (
                  <div style={{ display: "grid", gap: 8, flexShrink: 0 }}>
                    {alert.status === "OPEN" && (
                      <button
                        type="button"
                        onClick={() => void updateStatus(alert.id, "ACK")}
                        disabled={isUpdating}
                        style={{
                          ...secondaryButtonStyle,
                          padding: "8px 14px",
                          fontSize: 12,
                          borderColor: "rgba(245,158,11,0.22)",
                          background: "rgba(245,158,11,0.08)",
                          color: "#d97706",
                        }}
                      >
                        {isUpdating ? "..." : "Acknowledge"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void updateStatus(alert.id, "RESOLVED")}
                      disabled={isUpdating}
                      style={{
                        ...secondaryButtonStyle,
                        padding: "8px 14px",
                        fontSize: 12,
                        borderColor: "rgba(34,197,94,0.22)",
                        background: "rgba(34,197,94,0.08)",
                        color: "#16a34a",
                      }}
                    >
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
