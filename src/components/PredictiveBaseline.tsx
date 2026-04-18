"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartPoint {
  date: string;
  actual?: number;
  ma7?: number;
  predicted?: number;
  band?: [number, number]; // [lower, upper] for area
  isPredicted?: boolean;
}

interface Summary {
  lastActual: number;
  nextWeekAvg: number;
  trend: "up" | "down";
  trendPct: number;
  windowUsed: number;
  forecastDays: number;
  metric: string;
  platform: string;
  dataPoints: number;
}

interface ApiResponse {
  historical: {
    date: string; actual: number; ma7: number;
    ma14: number; ma28: number; upper: number; lower: number;
  }[];
  forecast: {
    date: string; predicted: number;
    upper: number; lower: number; isPredicted: true;
  }[];
  summary: Summary;
  error?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PredictiveBaselineProps {
  brandId: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const METRICS = [
  { key: "spend", label: "Spend",  prefix: "$", suffix: "",  color: "#5865f2" },
  { key: "roas",  label: "ROAS",   prefix: "",  suffix: "x", color: "#16a34a" },
  { key: "ctr",   label: "CTR",    prefix: "",  suffix: "%", color: "#0f766e" },
  { key: "cpc",   label: "CPC",    prefix: "$", suffix: "",  color: "#b7791f" },
] as const;

const WINDOWS = [7, 14, 28] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | undefined, prefix = "", suffix = "", decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return "—";
  const n = Number(val);
  const formatted =
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000  ? `${(n / 1_000).toFixed(1)}k`
    : n.toFixed(decimals);
  return `${prefix}${formatted}${suffix}`;
}

function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, metricMeta }: any) {
  if (!active || !payload?.length) return null;
  const isPredicted = payload[0]?.payload?.isPredicted;

  const tooltipStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "12px",
    minWidth: "160px",
  };

  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 700, color: "var(--t1)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
        {shortDate(label)}
        {isPredicted && (
          <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "rgba(88,101,242,0.1)", color: "#5865f2", fontWeight: 600 }}>
            Predicted
          </span>
        )}
      </div>
      {payload.map((p: any) => {
        if (p.name === "band" || p.value === undefined) return null;
        return (
          <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: "var(--t2)", marginBottom: "3px" }}>
            <span style={{ color: p.color }}>{p.name}</span>
            <span style={{ fontWeight: 600, color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>
              {fmt(p.value, metricMeta.prefix, metricMeta.suffix)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PredictiveBaseline({
  brandId,
  platform = "",
  dateFrom = "",
  dateTo   = "",
}: PredictiveBaselineProps) {
  const [data,       setData]       = useState<ApiResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [metric,     setMetric]     = useState<"spend" | "roas" | "ctr" | "cpc">("spend");
  const [windowSize, setWindowSize] = useState<7 | 14 | 28>(7);

  const metricMeta = METRICS.find(m => m.key === metric) ?? METRICS[0];

  const fetchData = useCallback(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    setLoading(true);
    setError(null);

    const p = new URLSearchParams({ brandId, metric, window: String(windowSize) });
    if (platform) p.set("platform", platform);
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo)   p.set("dateTo",   dateTo);

    fetch(`/api/analytics/predictive-baseline?${p}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load prediction data"))
      .finally(() => setLoading(false));
  }, [brandId, platform, dateFrom, dateTo, metric, windowSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Build unified chart data ────────────────────────────────────────────
  const chartData: ChartPoint[] = [];

  if (data) {
    for (const h of data.historical) {
      chartData.push({
        date:   h.date,
        actual: h.actual,
        ma7:    h.ma7,
        band:   [h.lower, h.upper],
      });
    }
    // Bridge: last historical point connects to first forecast
    const last = data.historical[data.historical.length - 1];
    if (last && data.forecast.length > 0) {
      // Add transition point so lines connect
      chartData[chartData.length - 1] = {
        ...chartData[chartData.length - 1],
        predicted: last.actual, // anchor the predicted line at last actual
      };
    }
    for (const f of data.forecast) {
      chartData.push({
        date:        f.date,
        predicted:   f.predicted,
        band:        [f.lower, f.upper],
        isPredicted: true,
      });
    }
  }

  const todayStr = chartData.find(p => p.isPredicted)?.date;
  const summary  = data?.summary;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "22px",
    marginBottom: "24px",
  };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "5px 13px",
    fontSize: "12px",
    fontWeight: active ? 700 : 500,
    fontFamily: "inherit",
    border: "none",
    cursor: "pointer",
    background: active ? metricMeta.color : "transparent",
    color: active ? "white" : "var(--t2)",
    borderRadius: "6px",
    transition: "all 0.15s",
  });
  const winBtn = (active: boolean): React.CSSProperties => ({
    padding: "4px 11px",
    fontSize: "11px",
    fontWeight: active ? 700 : 500,
    fontFamily: "inherit",
    border: active ? `1px solid ${metricMeta.color}` : "1px solid var(--border)",
    cursor: "pointer",
    background: active ? `${metricMeta.color}18` : "transparent",
    color: active ? metricMeta.color : "var(--t3)",
    borderRadius: "6px",
    transition: "all 0.15s",
  });
  const kpiCard: React.CSSProperties = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "14px 16px",
    flex: 1,
  };

  return (
    <div style={card}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>
            Predictive baseline
          </div>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--t1)", margin: 0 }}>
            Next 7-day performance forecast
          </h2>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>
            Moving average baseline · {windowSize}-day window · shaded band = ±1 std dev
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Window selector */}
          <div style={{ display: "flex", gap: "4px" }}>
            {WINDOWS.map(w => (
              <button key={w} onClick={() => setWindowSize(w)} style={winBtn(windowSize === w)}>
                {w}d
              </button>
            ))}
          </div>

          {/* Metric tabs */}
          <div style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
            {METRICS.map(m => (
              <button key={m.key} onClick={() => setMetric(m.key as typeof metric)} style={tabBtn(metric === m.key)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI summary cards ────────────────────────────────────────────── */}
      {summary && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={kpiCard}>
            <div style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Last actual
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>
              {fmt(summary.lastActual, metricMeta.prefix, metricMeta.suffix)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>Most recent data point</div>
          </div>

          <div style={kpiCard}>
            <div style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Next week avg
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: metricMeta.color, fontVariantNumeric: "tabular-nums" }}>
              {fmt(summary.nextWeekAvg, metricMeta.prefix, metricMeta.suffix)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>7-day MA forecast</div>
          </div>

          <div style={kpiCard}>
            <div style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Trend
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
              <div style={{
                fontSize: "22px", fontWeight: 800,
                color: summary.trend === "up"
                  ? (metric === "cpc" ? "#E24B4A" : "#16a34a")
                  : (metric === "cpc" ? "#16a34a" : "#E24B4A"),
              }}>
                {summary.trend === "up" ? "▲" : "▼"} {summary.trendPct.toFixed(1)}%
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>
              vs last actual · {metric === "cpc" ? (summary.trend === "up" ? "costs rising" : "costs falling") : (summary.trend === "up" ? "improving" : "declining")}
            </div>
          </div>

          <div style={kpiCard}>
            <div style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Data points
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--t1)" }}>
              {summary.dataPoints}
            </div>
            <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>
              Historical days used
            </div>
          </div>
        </div>
      )}

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: metricMeta.color, animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {error && !loading && (
        <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--t3)", textAlign: "center" }}>{error}</div>
          <button onClick={fetchData} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", cursor: "pointer", fontFamily: "inherit" }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <>
          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
            {[
              { color: metricMeta.color, label: "Actual", dashed: false, dot: true },
              { color: metricMeta.color, label: `MA ${windowSize}d baseline`, dashed: true, dot: false },
              { color: metricMeta.color, label: "Forecast", dashed: false, dot: false, predicted: true },
              { color: metricMeta.color, label: "Confidence band", band: true },
            ].map(({ color, label, dashed, dot, predicted, band }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                {band ? (
                  <div style={{ width: 18, height: 10, borderRadius: 2, background: `${color}22`, border: `1px solid ${color}55` }} />
                ) : predicted ? (
                  <svg width="18" height="6">
                    <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2.5" />
                    <circle cx="9" cy="3" r="2.5" fill={color} opacity="0.4" />
                  </svg>
                ) : (
                  <svg width="18" height="6">
                    <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2"
                      strokeDasharray={dashed ? "4 3" : undefined} />
                    {dot && <circle cx="9" cy="3" r="2" fill={color} />}
                  </svg>
                )}
                <span style={{ fontSize: "11px", color: "var(--t2)", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`band-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={metricMeta.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={metricMeta.color} stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--t3)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={shortDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--t3)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => fmt(v, metricMeta.prefix, metricMeta.suffix, 0)}
                width={52}
              />

              <Tooltip content={<CustomTooltip metricMeta={metricMeta} />} />

              {/* Confidence band */}
              <Area
                dataKey="band"
                fill={`url(#band-${metric})`}
                stroke="none"
                name="band"
                dot={false}
                activeDot={false}
                connectNulls
              />

              {/* MA baseline — dashed */}
              <Line
                dataKey="ma7"
                name={`MA ${windowSize}d`}
                stroke={metricMeta.color}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
                opacity={0.6}
              />

              {/* Actual values — solid */}
              <Line
                dataKey="actual"
                name="Actual"
                stroke={metricMeta.color}
                strokeWidth={2.5}
                dot={(props: any) => {
                  if (!props.payload?.actual) return <g key={props.key} />;
                  return (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={metricMeta.color}
                      stroke="var(--card)"
                      strokeWidth={1.5}
                    />
                  );
                }}
                connectNulls
              />

              {/* Predicted line — distinct style */}
              <Line
                dataKey="predicted"
                name="Forecast"
                stroke={metricMeta.color}
                strokeWidth={2.5}
                strokeDasharray="2 0"
                dot={(props: any) => {
                  if (props.payload?.predicted === undefined) return <g key={props.key} />;
                  return (
                    <circle
                      key={props.key}
                      cx={props.cx}
                      cy={props.cy}
                      r={3.5}
                      fill="var(--card)"
                      stroke={metricMeta.color}
                      strokeWidth={2}
                      opacity={0.7}
                    />
                  );
                }}
                connectNulls
                opacity={0.85}
              />

              {/* Today reference line */}
              {todayStr && (
                <ReferenceLine
                  x={todayStr}
                  stroke="var(--t3)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  label={{
                    value: "Today →",
                    position: "insideTopLeft",
                    fontSize: 10,
                    fill: "var(--t3)",
                    dy: -4,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          {/* Footer note */}
          <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--t3)" }}>
              Method: recursive {windowSize}-day moving average · confidence = ±1 std dev, widening with forecast horizon
            </span>
            <span style={{ fontSize: "11px", color: "var(--t3)" }}>
              Based on <strong style={{ color: "var(--t2)", fontWeight: 600 }}>{summary?.dataPoints ?? 0}</strong> historical data points
            </span>
          </div>
        </>
      )}
    </div>
  );
}