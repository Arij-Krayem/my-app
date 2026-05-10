"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

interface Anomaly {
  id: string;
  campaign: string;
  metric: string;
  score: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  dateRange: string;
  description: string;
  platform: string;
  recommendation: string;
  direction: "up" | "down";
  z_score?: number;
  pct_change?: number;
  method?: string;
}

const SEV: Record<string, { color: string; bg: string; border: string; label: string }> = {
  HIGH: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)", label: "High" },
  MEDIUM: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)", label: "Medium" },
  LOW: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.25)", label: "Low" },
};

const SEV_CLASS: Record<Anomaly["severity"], string> = {
  HIGH: styles.severityHigh,
  MEDIUM: styles.severityMedium,
  LOW: styles.severityLow,
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [engine, setEngine] = useState("");
  const [metricFilter, setMetric] = useState("All Metrics");
  const [severityFilter, setSeverity] = useState("All Severity");
  const [expanded, setExpanded] = useState<string | null>(null);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const loadAnomalies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/anomalies", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load anomalies");
      const data = await res.json();
      setAnomalies(data.items ?? []);
      setEngine(data.engine ?? "");
    } catch {
      setError("Could not load anomalies. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnomalies(); }, [loadAnomalies]);

  const visible = anomalies
    .filter(a => metricFilter === "All Metrics" || a.metric === metricFilter)
    .filter(a => severityFilter === "All Severity" || a.severity === severityFilter);

  const summary = {
    high: anomalies.filter(a => a.severity === "HIGH").length,
    medium: anomalies.filter(a => a.severity === "MEDIUM").length,
    low: anomalies.filter(a => a.severity === "LOW").length,
  };

  const uniqueMetrics = ["All Metrics", ...Array.from(new Set(anomalies.map(a => a.metric)))];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">ANOMALIES</div>
          <h1 className="dashboard-title">Statistical anomaly review</h1>
          <p className="dashboard-subtitle">Explore significant deviations, inspect anomaly scores, and review recommendations in one consistent workspace.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <button onClick={loadAnomalies} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && <div className="dashboard-banner-error">{error}</div>}

      <div className={styles.summaryRow}>
        {[
          { count: summary.high, ...SEV.HIGH },
          { count: summary.medium, ...SEV.MEDIUM },
          { count: summary.low, ...SEV.LOW },
        ].map(s => (
          <div key={s.label} className={`${styles.summaryPill} ${SEV_CLASS[s.label.toUpperCase() as Anomaly["severity"]]}`}>
            <span className={styles.summaryText}>{loading ? "-" : s.count} {s.label}</span>
          </div>
        ))}
      </div>

      <div className={`dashboard-card ${styles.filterCard}`}>
        <select value={metricFilter} onChange={e => setMetric(e.target.value)} className={`dashboard-select ${styles.filterSelect}`}>
          {uniqueMetrics.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverity(e.target.value)} className={`dashboard-select ${styles.filterSelect}`}>
          {["All Severity", "HIGH", "MEDIUM", "LOW"].map(o => <option key={o}>{o}</option>)}
        </select>
        <span className={styles.resultCount}>{loading ? "Loading..." : `${visible.length} results`}</span>
      </div>

      {loading ? (
        <div className={`dashboard-card ${styles.loadingCard}`}>
          <div className={styles.loader} />
          <p className={styles.loadingText}>Running anomaly detection...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="dashboard-card dashboard-empty-state">
          <div className="dashboard-empty-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
          <div className="dashboard-empty-title">No anomalies found</div>
          <div className="dashboard-empty-subtitle">{anomalies.length === 0 ? "Upload more data to enable statistical anomaly detection." : "Try adjusting your current filters."}</div>
          <div className="dashboard-empty-action">
            <button className="btn-primary">Upload a dataset</button>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map((a, index) => {
            const sv = SEV[a.severity];
            const open = expanded === a.id;
            const anomalyKey = [a.id, a.campaign, a.metric, a.dateRange, index].join("-");
            const platformClass = a.platform === "Google" ? styles.platformGoogle : styles.platformMeta;
            return (
              <div key={anomalyKey} className={`dashboard-card ${styles.anomalyCard} ${SEV_CLASS[a.severity]} ${platformClass}`}>
                <div className={styles.cardTop}>
                  <div className={styles.cardBody}>
                    <div className={styles.metaRow}>
                      <h3 className={styles.campaignTitle}>{a.campaign}</h3>
                      <span className={styles.severityBadge}>{a.severity}</span>
                      <span className={styles.platformBadge}>{a.platform}</span>
                      {a.z_score !== undefined && <span className={styles.zScoreBadge}>Z={a.z_score.toFixed(2)}</span>}
                      {engine && <span className={styles.engineText}>{engine}</span>}
                    </div>

                    <div className={styles.metricBlock}>
                      <div className={styles.metricHeader}>
                        <div className={styles.metricNameWrap}>
                          <span className={styles.tinyLabel}>Metric</span>
                          <span className={styles.metricName}>{a.metric}</span>
                        </div>
                        <span className={styles.severityLabel}>{sv.label}</span>
                      </div>
                      <progress className={styles.scoreBar} value={a.score} max={1} />
                    </div>

                    <div className={styles.analysisGrid}>
                      <span className={styles.tinyLabel}>Date Range</span>
                      <span className={styles.tinyLabel}>Analysis</span>
                      <span className={styles.analysisValue}>{a.dateRange}</span>
                      <span className={styles.analysisValue}>{a.description}</span>
                    </div>
                  </div>

                  <div className={styles.scoreAside}>
                    <div className={styles.scoreText}>
                      <p className={styles.scoreLabel}>Anomaly Score</p>
                      <p className={styles.scoreValue}>{(a.score * 100).toFixed(0)}%</p>
                    </div>
                    <button onClick={() => setExpanded(open ? null : a.id)} className={`btn-primary ${styles.detailsButton}`}>
                      {open ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className={styles.detailsGrid}>
                    {[
                      { label: "Affected Metric", value: a.metric },
                      { label: "Severity Level", value: a.severity },
                      { label: "Anomaly Score", value: `${(a.score * 100).toFixed(0)}%` },
                      { label: "Z-Score", value: a.z_score !== undefined ? a.z_score.toFixed(4) : "—" },
                      { label: "Platform", value: a.platform },
                      { label: "Detection Method", value: a.method ?? engine ?? "—" },
                      { label: "Date Range", value: a.dateRange },
                      { label: "Change vs Baseline", value: a.pct_change !== undefined ? `${a.direction === "up" ? "+" : "-"}${a.pct_change.toFixed(1)}%` : "—" },
                      { label: "Recommendation", value: a.recommendation },
                    ].map(d => (
                      <div key={d.label} className={`dashboard-card ${styles.detailCard}`}>
                        <p className={styles.detailLabel}>{d.label}</p>
                        <p className={styles.detailValue}>{d.value}</p>
                      </div>
                    ))}
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
