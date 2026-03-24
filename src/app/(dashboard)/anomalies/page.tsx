"use client";
import { useState, useEffect, useCallback } from "react";

interface Anomaly {
  id:             string;
  campaign:       string;
  metric:         string;
  score:          number;
  severity:       "HIGH" | "MEDIUM" | "LOW";
  dateRange:      string;
  description:    string;
  platform:       string;
  recommendation: string;
  direction:      "up" | "down";
  z_score?:       number;
  pct_change?:    number;
  method?:        string;
}

const SEV: Record<string, { color: string; bg: string; border: string; label: string }> = {
  HIGH:   { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)",  label: "High"   },
  MEDIUM: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)", label: "Medium" },
  LOW:    { color: "#3fb950", bg: "rgba(63,185,80,0.1)",  border: "rgba(63,185,80,0.25)",  label: "Low"    },
};

export default function AnomaliesPage() {
  const [anomalies,      setAnomalies]    = useState<Anomaly[]>([]);
  const [loading,        setLoading]      = useState(true);
  const [error,          setError]        = useState("");
  const [engine,         setEngine]       = useState("");
  const [metricFilter,   setMetric]       = useState("All Metrics");
  const [severityFilter, setSeverity]     = useState("All Severity");
  const [expanded,       setExpanded]     = useState<string | null>(null);

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
    .filter(a => metricFilter   === "All Metrics"  || a.metric   === metricFilter)
    .filter(a => severityFilter === "All Severity" || a.severity === severityFilter);

  const selSt: React.CSSProperties = {
    padding: "9px 14px", background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: "10px", color: "var(--t1)", fontSize: "13px", fontFamily: "inherit",
    outline: "none", cursor: "pointer", fontWeight: "500",
  };

  const summary = {
    high:   anomalies.filter(a => a.severity === "HIGH").length,
    medium: anomalies.filter(a => a.severity === "MEDIUM").length,
    low:    anomalies.filter(a => a.severity === "LOW").length,
  };

  const uniqueMetrics = ["All Metrics", ...Array.from(new Set(anomalies.map(a => a.metric)))];
  const isPython      = engine.includes("Python") || engine.includes("Z-Score + IQR");

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Anomalies</h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Explore statistical anomalies detected in your campaign performance</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {engine && (
            <span style={{
              fontSize: "11px", fontWeight: "700", padding: "5px 12px", borderRadius: "8px",
              background: isPython ? "rgba(88,101,242,0.1)" : "rgba(210,153,34,0.1)",
              color:      isPython ? "#5865f2"               : "#d29922",
              border:     `1px solid ${isPython ? "rgba(88,101,242,0.25)" : "rgba(210,153,34,0.25)"}`,
            }}>
              🔬 {engine}
            </span>
          )}
          <button onClick={loadAnomalies}
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

      {/* Summary pills */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { count: summary.high,   ...SEV.HIGH   },
          { count: summary.medium, ...SEV.MEDIUM },
          { count: summary.low,    ...SEV.LOW    },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "10px", background: s.bg, border: `1px solid ${s.border}` }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", fontWeight: "700", color: s.color }}>{loading ? "—" : s.count}</span>
            <span style={{ fontSize: "12px", color: s.color, opacity: 0.8 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <select value={metricFilter} onChange={e => setMetric(e.target.value)} style={selSt}>
          {uniqueMetrics.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={severityFilter} onChange={e => setSeverity(e.target.value)} style={selSt}>
          {["All Severity", "HIGH", "MEDIUM", "LOW"].map(o => <option key={o}>{o}</option>)}
        </select>
        {(metricFilter !== "All Metrics" || severityFilter !== "All Severity") && (
          <button onClick={() => { setMetric("All Metrics"); setSeverity("All Severity"); }}
            style={{ padding: "9px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" }}>
            Clear filters ×
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--t3)", fontWeight: "500" }}>
          {loading ? "Loading…" : `${visible.length} result${visible.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#f85149", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Running anomaly detection…</p>
        </div>

      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px" }}>
          <div style={{ color: "var(--t3)", display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
            </svg>
          </div>
          <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>No anomalies found</p>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>
            {anomalies.length === 0 ? "Upload more data to enable statistical anomaly detection." : "Try adjusting your filters"}
          </p>
        </div>

      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {visible.map((a, index) => {
            const sv   = SEV[a.severity];
            const open = expanded === a.id;
            const anomalyKey = [a.id, a.campaign, a.metric, a.dateRange, index].join("-");
            return (
              <div key={anomalyKey} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderLeft: `3px solid ${sv.color}`, borderRadius: "16px",
                overflow: "hidden", transition: "box-shadow 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>

                {/* Main row */}
                <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>{a.campaign}</h3>
                      <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: sv.bg, color: sv.color, border: `1px solid ${sv.border}` }}>{a.severity}</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: a.platform === "Google" ? "#4285F4" : "#1877F2" }}>{a.platform}</span>
                      {a.z_score !== undefined && (
                        <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "5px", background: "rgba(88,101,242,0.08)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)" }}>
                          Z={a.z_score.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Metric + bar */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Metric:</span>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>{a.metric}</span>
                          <span style={{ fontSize: "11px", color: "var(--t3)" }}>· Statistical Deviation</span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: sv.color }}>{sv.label}</span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "3px", background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${a.score * 100}%`, background: sv.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                      </div>
                    </div>

                    {/* Date + description */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 20px", fontSize: "12px" }}>
                      <span style={{ color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>DATE RANGE</span>
                      <span style={{ color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>ANALYSIS</span>
                      <span style={{ color: "var(--t1)", fontWeight: "500" }}>{a.dateRange}</span>
                      <span style={{ color: "var(--t1)", fontWeight: "500" }}>{a.description}</span>
                    </div>
                  </div>

                  {/* Score + actions */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Anomaly Score</p>
                      <p style={{ fontSize: "32px", fontWeight: "800", color: sv.color, lineHeight: 1 }}>{(a.score * 100).toFixed(0)}%</p>
                      {a.pct_change !== undefined && (
                        <p style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>
                          {a.direction === "up" ? "▲" : "▼"} {a.pct_change.toFixed(0)}% vs baseline
                        </p>
                      )}
                    </div>
                    <button onClick={() => setExpanded(open ? null : a.id)}
                      style={{ padding: "8px 18px", borderRadius: "9px", border: "none", background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(88,101,242,0.25)", whiteSpace: "nowrap" }}>
                      {open ? "Hide Details" : "View Details"}
                    </button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {open && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", background: "var(--bg)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
                    {[
                      { label: "Affected Metric",  value: a.metric },
                      { label: "Severity Level",   value: a.severity },
                      { label: "Anomaly Score",    value: `${(a.score * 100).toFixed(0)}%` },
                      { label: "Z-Score",          value: a.z_score !== undefined ? a.z_score.toFixed(4) : "—" },
                      { label: "Platform",         value: a.platform },
                      { label: "Detection Method", value: a.method ?? engine ?? "—" },
                      { label: "Date Range",       value: a.dateRange },
                      { label: "Change vs Baseline", value: a.pct_change !== undefined ? `${a.direction === "up" ? "+" : "-"}${a.pct_change.toFixed(1)}%` : "—" },
                      { label: "Recommendation",   value: a.recommendation },
                    ].map(d => (
                      <div key={d.label} style={{ padding: "14px", borderRadius: "10px", background: "var(--card)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{d.label}</p>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{d.value}</p>
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
