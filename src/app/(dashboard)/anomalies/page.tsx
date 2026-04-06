"use client";
import { useState, useEffect, useCallback } from "react";

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

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { count: summary.high, ...SEV.HIGH },
          { count: summary.medium, ...SEV.MEDIUM },
          { count: summary.low, ...SEV.LOW },
        ].map(s => (
          <div key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "999px", background: s.bg, border: `1px solid ${s.border}` }}>
            <span style={{ fontSize: "13px", fontWeight: "800", color: s.color }}>{loading ? "-" : s.count} {s.label}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-card" style={{ padding: "18px 20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <select value={metricFilter} onChange={e => setMetric(e.target.value)} className="dashboard-select" style={{ width: "220px" }}>
          {uniqueMetrics.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverity(e.target.value)} className="dashboard-select" style={{ width: "220px" }}>
          {["All Severity", "HIGH", "MEDIUM", "LOW"].map(o => <option key={o}>{o}</option>)}
        </select>
        <span style={{ marginLeft: "auto", fontSize: "14px", color: "var(--t3)", fontWeight: "700" }}>{loading ? "Loading..." : `${visible.length} results`}</span>
      </div>

      {loading ? (
        <div className="dashboard-card" style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Running anomaly detection...</p>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visible.map((a, index) => {
            const sv = SEV[a.severity];
            const open = expanded === a.id;
            const anomalyKey = [a.id, a.campaign, a.metric, a.dateRange, index].join("-");
            return (
              <div key={anomalyKey} className="dashboard-card" style={{ borderLeft: `4px solid ${sv.color}`, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: "800", color: "var(--t1)" }}>{a.campaign}</h3>
                      <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "999px", background: sv.bg, color: sv.color, border: `1px solid ${sv.border}` }}>{a.severity}</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: a.platform === "Google" ? "#4285F4" : "#1877F2" }}>{a.platform}</span>
                      {a.z_score !== undefined && <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", background: "#eef2ff", color: "#5865f2" }}>Z={a.z_score.toFixed(2)}</span>}
                      {engine && <span style={{ fontSize: "11px", color: "var(--t3)" }}>{engine}</span>}
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>Metric</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>{a.metric}</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "800", color: sv.color }}>{sv.label}</span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${a.score * 100}%`, background: sv.color, borderRadius: "999px" }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 20px", fontSize: "12px" }}>
                      <span style={{ color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>Date Range</span>
                      <span style={{ color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>Analysis</span>
                      <span style={{ color: "var(--t1)", fontWeight: "600" }}>{a.dateRange}</span>
                      <span style={{ color: "var(--t1)", fontWeight: "600" }}>{a.description}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Anomaly Score</p>
                      <p style={{ fontSize: "32px", fontWeight: "800", color: sv.color, lineHeight: 1 }}>{(a.score * 100).toFixed(0)}%</p>
                    </div>
                    <button onClick={() => setExpanded(open ? null : a.id)} className="btn-primary" style={{ padding: "10px 16px" }}>
                      {open ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", background: "#f8fafc", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
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
                      <div key={d.label} className="dashboard-card" style={{ padding: "14px" }}>
                        <p style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{d.label}</p>
                        <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>{d.value}</p>
                      </div>
                    ))}
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
