"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import styles from "./PredictiveBaseline.module.css";

interface ChartPoint {
  date: string;
  actual?: number;
  ma7?: number;
  predicted?: number;
  band?: [number, number];
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

interface PredictiveBaselineProps {
  brandId: string;
  platform?: string;
  dateFrom?: string;
  dateTo?: string;
}

const METRICS = [
  { key: "spend", label: "Spend", prefix: "$", suffix: "", color: "#5865f2" },
  { key: "roas", label: "ROAS", prefix: "", suffix: "x", color: "#16a34a" },
  { key: "ctr", label: "CTR", prefix: "", suffix: "%", color: "#0f766e" },
  { key: "cpc", label: "CPC", prefix: "$", suffix: "", color: "#b7791f" },
] as const;

const WINDOWS = [7, 14, 28] as const;

type MetricKey = typeof METRICS[number]["key"];
type MetricMeta = typeof METRICS[number];
interface TooltipPayload {
  name: string;
  value?: number;
  color: string;
  payload?: { isPredicted?: boolean };
}
interface DotProps {
  key?: string;
  payload?: ChartPoint;
  cx?: number;
  cy?: number;
}

function fmt(val: number | undefined, prefix = "", suffix = "", decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return "—";
  const n = Number(val);
  const formatted =
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
    : n.toFixed(decimals);
  return `${prefix}${formatted}${suffix}`;
}

function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function metricClass(metric: MetricKey) {
  if (metric === "roas") return styles.metricRoas;
  if (metric === "ctr") return styles.metricCtr;
  if (metric === "cpc") return styles.metricCpc;
  return styles.metricSpend;
}

function CustomTooltip({ active, payload, label, metricMeta }: { active?: boolean; payload?: TooltipPayload[]; label?: string; metricMeta: MetricMeta }) {
  if (!active || !payload?.length) return null;
  const isPredicted = payload[0]?.payload?.isPredicted;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        {shortDate(label)}
        {isPredicted && (
          <span className={styles.predictedBadge}>
            Predicted
          </span>
        )}
      </div>
      {payload.map((p) => {
        if (p.name === "band" || p.value === undefined) return null;
        return (
          <div key={p.name} className={styles.tooltipRow}>
            <span className={styles.tooltipSeries}>
              <svg className={styles.tooltipDot} viewBox="0 0 8 8" aria-hidden="true">
                <circle cx="4" cy="4" r="4" fill={p.color} />
              </svg>
              {p.name}
            </span>
            <span className={styles.tooltipValue}>
              {fmt(p.value, metricMeta.prefix, metricMeta.suffix)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PredictiveBaseline({
  brandId,
  platform = "",
  dateFrom = "",
  dateTo = "",
}: PredictiveBaselineProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("spend");
  const [windowSize, setWindowSize] = useState<7 | 14 | 28>(7);
  const requestSeq = useRef(0);

  const metricMeta = METRICS.find(m => m.key === metric) ?? METRICS[0];

  const fetchData = useCallback(() => {
    if (!brandId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const requestId = ++requestSeq.current;

    setLoading(true);
    setError(null);

    const p = new URLSearchParams({ brandId, metric, window: String(windowSize) });
    if (platform) p.set("platform", platform);
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);

    fetch(`/api/analytics/predictive-baseline?${p}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.json())
      .then(d => {
        if (requestId !== requestSeq.current) return;
        if (d.error) {
          setData(null);
          setError(d.error);
        } else {
          setData(d);
          setError(null);
        }
      })
      .catch(() => {
        if (requestId !== requestSeq.current) return;
        setData(null);
        setError("Failed to load prediction data");
      })
      .finally(() => {
        if (requestId !== requestSeq.current) return;
        setLoading(false);
      });
  }, [brandId, platform, dateFrom, dateTo, metric, windowSize]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { fetchData(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  const chartData: ChartPoint[] = [];

  if (data) {
    for (const h of data.historical) {
      chartData.push({
        date: h.date,
        actual: h.actual,
        ma7: h.ma7,
        band: [h.lower, h.upper],
      });
    }
    const last = data.historical[data.historical.length - 1];
    if (last && data.forecast.length > 0) {
      chartData[chartData.length - 1] = {
        ...chartData[chartData.length - 1],
        predicted: last.actual,
      };
    }
    for (const f of data.forecast) {
      chartData.push({
        date: f.date,
        predicted: f.predicted,
        band: [f.lower, f.upper],
        isPredicted: true,
      });
    }
  }

  const todayStr = chartData.find(p => p.isPredicted)?.date;
  const summary = data?.summary;
  const isPositiveTrend = summary ? (metric === "cpc" ? summary.trend === "down" : summary.trend === "up") : false;

  return (
    <div className={`${styles.card} ${metricClass(metric)}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            Predictive baseline
          </div>
          <h2 className={styles.title}>
            Next 7-day performance forecast
          </h2>
          <p className={styles.subtitle}>
            Moving average baseline &middot; {windowSize}-day window &middot; shaded band = &plusmn;1 std dev
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.windowButtons}>
            {WINDOWS.map(w => (
              <button
                key={w}
                onClick={() => setWindowSize(w)}
                className={`${styles.windowButton} ${windowSize === w ? styles.windowButtonActive : ""}`}
              >
                {w}d
              </button>
            ))}
          </div>

          <div className={styles.metricTabs}>
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`${styles.metricTab} ${metric === m.key ? styles.metricTabActive : ""}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Last actual</div>
            <div className={styles.kpiValue}>
              {fmt(summary.lastActual, metricMeta.prefix, metricMeta.suffix)}
            </div>
            <div className={styles.kpiNote}>Most recent data point</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Next week avg</div>
            <div className={`${styles.kpiValue} ${styles.metricText}`}>
              {fmt(summary.nextWeekAvg, metricMeta.prefix, metricMeta.suffix)}
            </div>
            <div className={styles.kpiNote}>7-day MA forecast</div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Trend</div>
            <div className={styles.trendWrap}>
              <div className={`${styles.trendValue} ${isPositiveTrend ? styles.trendGood : styles.trendBad}`}>
                {summary.trend === "up" ? "▲" : "▼"} {summary.trendPct.toFixed(1)}%
              </div>
            </div>
            <div className={styles.kpiNote}>
              vs last actual &middot; {metric === "cpc" ? (summary.trend === "up" ? "costs rising" : "costs falling") : (summary.trend === "up" ? "improving" : "declining")}
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Data points</div>
            <div className={styles.kpiValue}>
              {summary.dataPoints}
            </div>
            <div className={styles.kpiNote}>
              Historical days used
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
        </div>
      )}

      {error && !loading && (
        <div className={styles.errorState}>
          <div className={styles.errorText}>{error}</div>
          <button onClick={fetchData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <>
          <div className={styles.legend}>
            {[
              { color: metricMeta.color, label: "Actual", dashed: false, dot: true },
              { color: metricMeta.color, label: `MA ${windowSize}d baseline`, dashed: true, dot: false },
              { color: metricMeta.color, label: "Forecast", dashed: false, dot: false, predicted: true },
              { color: metricMeta.color, label: "Confidence band", band: true },
            ].map(({ color, label, dashed, dot, predicted, band }) => (
              <div key={label} className={styles.legendItem}>
                {band ? (
                  <span className={styles.bandSwatch} />
                ) : predicted ? (
                  <svg width="18" height="6">
                    <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2.5" />
                    <circle cx="9" cy="3" r="2.5" fill={color} opacity="0.4" />
                  </svg>
                ) : (
                  <svg width="18" height="6">
                    <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4 3" : undefined} />
                    {dot && <circle cx="9" cy="3" r="2" fill={color} />}
                  </svg>
                )}
                <span className={styles.legendLabel}>{label}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`band-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricMeta.color} stopOpacity={0.15} />
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

              <Area
                dataKey="band"
                fill={`url(#band-${metric})`}
                stroke="none"
                name="band"
                dot={false}
                activeDot={false}
                connectNulls
              />

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

              <Line
                dataKey="actual"
                name="Actual"
                stroke={metricMeta.color}
                strokeWidth={2.5}
                dot={(props: DotProps) => {
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

              <Line
                dataKey="predicted"
                name="Forecast"
                stroke={metricMeta.color}
                strokeWidth={2.5}
                strokeDasharray="2 0"
                dot={(props: DotProps) => {
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

              {todayStr && (
                <ReferenceLine
                  x={todayStr}
                  stroke="var(--t3)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  label={{
                    value: "Today ->",
                    position: "insideTopLeft",
                    fontSize: 10,
                    fill: "var(--t3)",
                    dy: -4,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          <div className={styles.footerNote}>
            <span>
              Method: recursive {windowSize}-day moving average &middot; confidence = &plusmn;1 std dev, widening with forecast horizon
            </span>
            <span>
              Based on <strong className={styles.footerStrong}>{summary?.dataPoints ?? 0}</strong> historical data points
            </span>
          </div>
        </>
      )}
    </div>
  );
}
