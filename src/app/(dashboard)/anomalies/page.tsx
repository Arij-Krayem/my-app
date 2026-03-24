"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import StatBadge from "@/components/ui/StatBadge";
import { btnSecondary, cardStyle } from "@/lib/styles";

interface Anomaly {
  campaign: string;
  dateRange: string;
  description: string;
  direction: "down" | "up";
  id: string;
  metric: string;
  platform: string;
  recommendation: string;
  score: number;
  severity: "HIGH" | "LOW" | "MEDIUM";
}

const SEVERITY_CONFIG: Record<Anomaly["severity"], { bg: string; border: string; color: string; label: string }> = {
  HIGH: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)", label: "High" },
  MEDIUM: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)", label: "Medium" },
  LOW: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.25)", label: "Low" },
};

export default function AnomaliesPage(): React.ReactElement {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metricFilter, setMetricFilter] = useState("All Metrics");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadAnomalies = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("access_token") ?? "";
      const response = await fetch("/api/anomalies", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to load anomalies");

      const data = (await response.json()) as { items?: Anomaly[] };
      setAnomalies(data.items ?? []);
    } catch {
      setError("Could not load anomalies. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnomalies();
  }, [loadAnomalies]);

  const visibleAnomalies = useMemo(
    () =>
      anomalies
        .filter((anomaly) => metricFilter === "All Metrics" || anomaly.metric === metricFilter)
        .filter((anomaly) => severityFilter === "All Severity" || anomaly.severity === severityFilter),
    [anomalies, metricFilter, severityFilter],
  );

  const summary = {
    high: anomalies.filter((anomaly) => anomaly.severity === "HIGH").length,
    medium: anomalies.filter((anomaly) => anomaly.severity === "MEDIUM").length,
    low: anomalies.filter((anomaly) => anomaly.severity === "LOW").length,
  };

  const uniqueMetrics = ["All Metrics", ...Array.from(new Set(anomalies.map((anomaly) => anomaly.metric)))];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <StatBadge count={summary.high} label="High" color="#f85149" bg="rgba(248,81,73,0.1)" border="rgba(248,81,73,0.25)" />
          <StatBadge count={summary.medium} label="Medium" color="#d29922" bg="rgba(210,153,34,0.1)" border="rgba(210,153,34,0.25)" />
          <StatBadge count={summary.low} label="Low" color="#3fb950" bg="rgba(63,185,80,0.1)" border="rgba(63,185,80,0.25)" />
        </div>
        <button onClick={() => void loadAnomalies()} style={btnSecondary}>
          Refresh
        </button>
      </div>

      {error ? (
        <div style={{ background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.25)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#f85149", fontSize: "14px" }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <select value={metricFilter} onChange={(event) => setMetricFilter(event.target.value)} style={{ padding: "9px 14px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "13px", fontFamily: "inherit", outline: "none", cursor: "pointer", fontWeight: 500 }}>
          {uniqueMetrics.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} style={{ padding: "9px 14px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "13px", fontFamily: "inherit", outline: "none", cursor: "pointer", fontWeight: 500 }}>
          {["All Severity", "HIGH", "MEDIUM", "LOW"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        {metricFilter !== "All Metrics" || severityFilter !== "All Severity" ? (
          <button onClick={() => { setMetricFilter("All Metrics"); setSeverityFilter("All Severity"); }} style={btnSecondary}>
            Clear filters
          </button>
        ) : null}
        <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--t3)", fontWeight: 500 }}>
          {loading ? "Loading..." : `${visibleAnomalies.length} result${visibleAnomalies.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "80px 20px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#f85149", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Running anomaly detection...</p>
        </div>
      ) : visibleAnomalies.length === 0 ? (
        <EmptyState
          title="No anomalies found"
          subtitle={anomalies.length === 0 ? "Upload more data to enable statistical anomaly detection." : "Try adjusting your filters."}
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visibleAnomalies.map((anomaly) => {
            const severity = SEVERITY_CONFIG[anomaly.severity];
            const open = expanded === anomaly.id;

            return (
              <div key={anomaly.id} style={{ ...cardStyle, borderLeft: `3px solid ${severity.color}`, overflow: "hidden", transition: "box-shadow 0.15s" }}>
                <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)" }}>{anomaly.campaign}</h2>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", background: severity.bg, color: severity.color, border: `1px solid ${severity.border}` }}>{anomaly.severity}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: anomaly.platform === "Google" ? "#4285F4" : "#1877F2" }}>{anomaly.platform}</span>
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Metric:</span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)" }}>{anomaly.metric}</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: severity.color }}>{severity.label}</span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "3px", background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${anomaly.score * 100}%`, background: severity.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 20px", fontSize: "12px" }}>
                      <span style={{ color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Date Range</span>
                      <span style={{ color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Analysis</span>
                      <span style={{ color: "var(--t1)", fontWeight: 500 }}>{anomaly.dateRange}</span>
                      <span style={{ color: "var(--t1)", fontWeight: 500 }}>{anomaly.description}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "10px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Anomaly Score</p>
                      <p style={{ fontSize: "32px", fontWeight: 800, color: severity.color, lineHeight: 1 }}>{(anomaly.score * 100).toFixed(0)}%</p>
                    </div>
                    <button onClick={() => setExpanded(open ? null : anomaly.id)} style={{ padding: "8px 18px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "#ffffff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(88,101,242,0.25)", whiteSpace: "nowrap" }}>
                      {open ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {open ? (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", background: "var(--bg)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
                    {[
                      { label: "Affected Metric", value: anomaly.metric },
                      { label: "Severity Level", value: anomaly.severity },
                      { label: "Anomaly Score", value: `${(anomaly.score * 100).toFixed(0)}%` },
                      { label: "Date Range", value: anomaly.dateRange },
                      { label: "Platform", value: anomaly.platform },
                      { label: "Recommendation", value: anomaly.recommendation },
                    ].map((detail) => (
                      <div key={detail.label} style={{ padding: "14px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "10px", color: "var(--t3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{detail.label}</p>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)" }}>{detail.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
