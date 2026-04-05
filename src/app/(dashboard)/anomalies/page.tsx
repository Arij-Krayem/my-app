"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cardStyle,
  emptyIconWrapStyle,
  emptyStateWrapStyle,
  emptySubtitleStyle,
  emptyTitleStyle,
  largeCardStyle,
  pageEyebrowStyle,
  pageSubtitleStyle,
  pageTitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  subtleInputStyle,
  pillStyle,
} from "@/components/dashboard/designSystem";

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

const SEV = {
  HIGH: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.22)", label: "High" },
  MEDIUM: { color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)", label: "Medium" },
  LOW: { color: "#16a34a", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.22)", label: "Low" },
} as const;

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

  useEffect(() => {
    void loadAnomalies();
  }, [loadAnomalies]);

  const uniqueMetrics = useMemo(
    () => ["All Metrics", ...Array.from(new Set(anomalies.map((anomaly) => anomaly.metric)))],
    [anomalies],
  );

  const visible = anomalies
    .filter((anomaly) => metricFilter === "All Metrics" || anomaly.metric === metricFilter)
    .filter((anomaly) => severityFilter === "All Severity" || anomaly.severity === severityFilter);

  const summary = {
    high: anomalies.filter((anomaly) => anomaly.severity === "HIGH").length,
    medium: anomalies.filter((anomaly) => anomaly.severity === "MEDIUM").length,
    low: anomalies.filter((anomaly) => anomaly.severity === "LOW").length,
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={pageEyebrowStyle}>Anomalies</div>
          <h1 style={pageTitleStyle}>Statistical anomaly review</h1>
          <p style={pageSubtitleStyle}>Explore significant deviations, inspect anomaly scores, and review recommendations in one consistent workspace.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {engine ? <div style={pillStyle("#4f46e5", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.22)")}>{engine}</div> : null}
          <button type="button" onClick={() => void loadAnomalies()} style={secondaryButtonStyle}>
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
            background: "rgba(239,68,68,0.06)",
            borderColor: "rgba(239,68,68,0.2)",
            color: "#dc2626",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={pillStyle(SEV.HIGH.color, SEV.HIGH.bg, SEV.HIGH.border)}>{loading ? "--" : summary.high} High</div>
        <div style={pillStyle(SEV.MEDIUM.color, SEV.MEDIUM.bg, SEV.MEDIUM.border)}>{loading ? "--" : summary.medium} Medium</div>
        <div style={pillStyle(SEV.LOW.color, SEV.LOW.bg, SEV.LOW.border)}>{loading ? "--" : summary.low} Low</div>
      </div>

      <div style={{ ...largeCardStyle, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select value={metricFilter} onChange={(event) => setMetric(event.target.value)} style={{ ...subtleInputStyle, maxWidth: 220 }}>
            {uniqueMetrics.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverity(event.target.value)} style={{ ...subtleInputStyle, maxWidth: 220 }}>
            {["All Severity", "HIGH", "MEDIUM", "LOW"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          {(metricFilter !== "All Metrics" || severityFilter !== "All Severity") && (
            <button
              type="button"
              onClick={() => {
                setMetric("All Metrics");
                setSeverity("All Severity");
              }}
              style={secondaryButtonStyle}
            >
              Clear filters
            </button>
          )}
          <span style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
            {loading ? "Loading..." : `${visible.length} results`}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={emptyStateWrapStyle}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.12)", borderTopColor: "#6366F1", animation: "spin 0.8s linear infinite" }} />
          <p style={{ ...emptySubtitleStyle, marginTop: 18 }}>Running anomaly detection...</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={emptyStateWrapStyle}>
          <div style={emptyIconWrapStyle}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          </div>
          <h2 style={emptyTitleStyle}>No anomalies found</h2>
          <p style={emptySubtitleStyle}>
            {anomalies.length === 0 ? "Upload more data to enable statistical anomaly detection." : "Try adjusting the active filters to broaden the result set."}
          </p>
          {anomalies.length === 0 && (
            <a href="/uploads/new" style={{ ...primaryButtonStyle, marginTop: 20 }}>
              Upload a dataset
            </a>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {visible.map((anomaly, index) => {
            const sev = SEV[anomaly.severity];
            const open = expanded === anomaly.id;
            const rowKey = [anomaly.id, anomaly.campaign, anomaly.metric, anomaly.dateRange, index].join("-");
            return (
              <div key={rowKey} style={{ ...cardStyle, borderLeft: `3px solid ${sev.color}`, overflow: "hidden" }}>
                <div style={{ padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>{anomaly.campaign}</span>
                      <span style={pillStyle(sev.color, sev.bg, sev.border)}>{anomaly.severity}</span>
                      <span style={pillStyle("#4f46e5", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.22)")}>{anomaly.platform}</span>
                      {anomaly.z_score !== undefined && <span style={pillStyle("#0f766e", "rgba(20,184,166,0.1)", "rgba(20,184,166,0.2)")}>Z {anomaly.z_score.toFixed(2)}</span>}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>{anomaly.metric}</div>
                        <div style={{ color: sev.color, fontSize: 13, fontWeight: 700 }}>{(anomaly.score * 100).toFixed(0)}%</div>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: "rgba(148,163,184,0.18)", overflow: "hidden" }}>
                        <div style={{ width: `${anomaly.score * 100}%`, height: "100%", background: sev.color }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16 }}>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                          Date Range
                        </div>
                        <div style={{ color: "#334155", fontSize: 13 }}>{anomaly.dateRange}</div>
                      </div>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                          Analysis
                        </div>
                        <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.6 }}>{anomaly.description}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", justifyItems: "end", gap: 10 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                        Score
                      </div>
                      <div style={{ color: sev.color, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{(anomaly.score * 100).toFixed(0)}%</div>
                      {anomaly.pct_change !== undefined && (
                        <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 12 }}>
                          {anomaly.direction === "up" ? "+" : "-"}
                          {Math.abs(anomaly.pct_change).toFixed(1)}% vs baseline
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setExpanded(open ? null : anomaly.id)} style={open ? secondaryButtonStyle : primaryButtonStyle}>
                      {open ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {open && (
                  <div style={{ borderTop: "1px solid rgba(15,23,42,0.06)", background: "#fcfcff", padding: 20, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                    {[
                      { label: "Affected Metric", value: anomaly.metric },
                      { label: "Severity Level", value: anomaly.severity },
                      { label: "Anomaly Score", value: `${(anomaly.score * 100).toFixed(0)}%` },
                      { label: "Z-Score", value: anomaly.z_score !== undefined ? anomaly.z_score.toFixed(4) : "--" },
                      { label: "Platform", value: anomaly.platform },
                      { label: "Detection Method", value: anomaly.method ?? engine ?? "--" },
                      { label: "Date Range", value: anomaly.dateRange },
                      { label: "Change vs Baseline", value: anomaly.pct_change !== undefined ? `${anomaly.direction === "up" ? "+" : "-"}${Math.abs(anomaly.pct_change).toFixed(1)}%` : "--" },
                      { label: "Recommendation", value: anomaly.recommendation },
                    ].map((detail) => (
                      <div key={detail.label} style={{ ...cardStyle, padding: 14, boxShadow: "none" }}>
                        <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                          {detail.label}
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{detail.value}</div>
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
