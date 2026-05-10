"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

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

const SEV_CLASS: Record<Severity, string> = {
  CRITICAL: styles.severityCritical,
  WARNING: styles.severityWarning,
};

const STA_CLASS: Record<Status, string> = {
  OPEN: styles.statusOpen,
  ACK: styles.statusAck,
  RESOLVED: styles.statusResolved,
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
        <div className={`dashboard-card ${styles.loadingCard}`}>
          <div className={styles.loader} />
          <p className={styles.loadingText}>Loading alerts...</p>
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
        <div className={styles.alertList}>
          {visible.map(a => {
            const severity = getSeverity(a);
            const isUpdating = updating === a.id;

            return (
              <div key={a.id} className={`dashboard-card ${styles.alertCard} ${SEV_CLASS[severity]} ${STA_CLASS[a.status]} ${isUpdating ? styles.alertCardUpdating : ""}`}>
                <div className={styles.severityDot} />
                <div className={styles.alertContent}>
                  <div className={styles.alertMetaRow}>
                    <span className={styles.metricTitle}>{a.rule?.metricKey?.toUpperCase() ?? "Alert"}</span>
                    {a.brand?.name && (
                      <span className={styles.brandBadge}>
                        {a.brand.name}
                      </span>
                    )}
                    <span className={styles.severityBadge}>{severity}</span>
                    <span className={styles.statusBadge}>{a.status}</span>
                  </div>

                  <p className={styles.message}>{a.message}</p>

                  {a.rule && (
                    <div className={styles.ruleDetails}>
                      <div>
                        <span className={styles.detailLabel}>Metric</span>
                        <span className={styles.detailValue}>{a.rule.metricKey}</span>
                      </div>
                      <div>
                        <span className={styles.detailLabel}>Condition</span>
                        <span className={styles.detailValue}>{a.rule.operator} {a.rule.threshold}</span>
                      </div>
                    </div>
                  )}

                  <div className={styles.timestamp}>{timeAgo(a.createdAt)}</div>
                </div>

                {a.status !== "RESOLVED" && (
                  <div className={styles.actions}>
                    {a.status === "OPEN" && (
                      <button onClick={() => updateStatus(a.id, "ACK")} disabled={isUpdating} className={`btn-secondary ${styles.actionButton} ${styles.ackButton}`}>
                        {isUpdating ? "..." : "Acknowledge"}
                      </button>
                    )}
                    <button onClick={() => updateStatus(a.id, "RESOLVED")} disabled={isUpdating} className={`btn-secondary ${styles.actionButton} ${styles.resolveButton}`}>
                      {isUpdating ? "..." : "Resolve"}
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
