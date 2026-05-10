"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import styles from "./DashboardEnhanced.module.css";

interface TrendData {
  date: string;
  roas: number; ctr: number; cpc: number;
  spend: number; clicks: number; conversions: number;
  roas_google: number | null; roas_meta: number | null;
  ctr_google: number | null; ctr_meta: number | null;
  cpc_google: number | null; cpc_meta: number | null;
  spend_google: number | null; spend_meta: number | null;
  clicks_google: number | null; clicks_meta: number | null;
  conversions_google: number | null; conversions_meta: number | null;
  roas_prev: number | null; ctr_prev: number | null;
  cpc_prev: number | null; spend_prev: number | null;
  clicks_prev: number | null; conversions_prev: number | null;
}

interface Comparison { current: number; previous: number; change: number | null; }
interface AlertDay { date: string; total: number; open: number; acknowledged: number; resolved: number; critical: number; warning: number; }
interface FunnelStage { label: string; value: number; icon: string; color: string; rate: number | null; rateLabel?: string; }
interface PlatformDonut { platform: string; label: string; color: string; spend: number; clicks: number; impressions: number; conversions: number; roas: number; share: number; }
interface CampaignDonut { campaign: string; platform: string; spend: number; clicks: number; roas: number; share: number; color: string; }
interface GeoRowData { country: string; spend: number; clicks: number; conversions: number; roas: number; share: number; health: "good" | "warning" | "poor"; }
interface ConvTrend { date: string; impressions: number; clicks: number; conversions: number; }

interface Props { brandId: string; platform: string; dateFrom: string; dateTo: string; }
type DonutEntry = Record<string, string | number>;
interface PieShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: DonutEntry & { share?: number };
  index: number;
}

const GOOGLE_COLOR = "#4285F4";
const META_COLOR = "#1877F2";
const PREV_COLOR = "#888780";
const CTR_COLOR = "#8b5cf6";
const CPC_COLOR = "#f59e0b";

const tooltipStyle = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" },
};

const fmtDate = (d: string | number): string =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function toneClass(tone: "good" | "warning" | "poor") {
  if (tone === "good") return styles.toneGood;
  if (tone === "warning") return styles.toneWarning;
  return styles.tonePoor;
}

function platformClass(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized.includes("google")) return styles.platformGoogle;
  if (normalized.includes("meta") || normalized.includes("facebook")) return styles.platformMeta;
  return styles.platformDefault;
}

function stageIconClass(icon: string) {
  if (icon === "eye") return styles.stageImpressions;
  if (icon === "cursor") return styles.stageClicks;
  return styles.stageConversions;
}

function ChartLegend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div className={styles.chartLegend}>
      {items.map(item => (
        <div key={item.label} className={styles.chartLegendItem}>
          <svg width="18" height="6">
            <line x1="0" y1="3" x2="18" y2="3" stroke={item.color} strokeWidth="2" strokeDasharray={item.dashed ? "4 3" : undefined} />
          </svg>
          <span className={styles.chartLegendLabel}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SectionDivider({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={styles.sectionDivider}>
      <div className={styles.sectionAccent} />
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}

function PctBadge({ change, inverse = false }: { change: number | null; inverse?: boolean }) {
  if (change === null) return <span className={styles.emptyValue}>—</span>;
  const positive = inverse ? change < 0 : change > 0;
  return (
    <span className={`${styles.pctBadge} ${positive ? styles.pctPositive : styles.pctNegative}`}>
      {change > 0 ? "+" : ""}{change}%
    </span>
  );
}

function DonutChart({ data, valueKey, labelKey, colorKey, formatter }: {
  data: DonutEntry[]; valueKey: string; labelKey: string; colorKey: string; formatter: (v: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const renderPieShape = (props: PieShapeProps) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const isActive = props.index === activeIndex;
    const label = String(payload[labelKey]);
    const value = Number(payload[valueKey]);
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={isActive ? innerRadius - 4 : innerRadius} outerRadius={isActive ? outerRadius + 6 : outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        {isActive && <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--t1)" fontSize={13} fontWeight={700}>
          {label.length > 14 ? `${label.slice(0, 14)}...` : label}
        </text>}
        {isActive && <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--t2)" fontSize={12}>{formatter(value)}</text>}
        {isActive && <text x={cx} y={cy + 26} textAnchor="middle" fill="var(--t3)" fontSize={11}>{payload.share}%</text>}
      </g>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={labelKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          shape={renderPieShape}
          onMouseEnter={(_, i) => setActiveIndex(i)}
          onMouseLeave={() => setActiveIndex(null)}
          paddingAngle={2}
        >
          {data.map((entry, i) => <Cell key={i} fill={String(entry[colorKey])} stroke="transparent" />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle.contentStyle} formatter={(v: number | string) => [formatter(Number(v))]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function GeoRow({ row, maxSpend, index }: { row: GeoRowData; maxSpend: number; index: number }) {
  const pct = maxSpend > 0 ? (row.spend / maxSpend) * 100 : 0;
  return (
    <div className={`${styles.geoRow} ${index % 2 === 0 ? styles.geoRowEven : ""}`}>
      <span className={styles.geoRank}>{index + 1}</span>
      <div>
        <div className={styles.geoCountry}>{row.country}</div>
        <svg className={styles.geoBar} viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100" height="4" rx="2" fill="var(--border)" />
          <rect width={pct} height="4" rx="2" fill="#5865f2" />
        </svg>
      </div>
      <span className={styles.geoSpend}>${row.spend >= 1000 ? `${(row.spend / 1000).toFixed(1)}k` : row.spend.toFixed(0)}</span>
      <span className={styles.geoText}>{row.share}%</span>
      <span className={styles.geoText}>{row.conversions.toLocaleString()}</span>
      <div className={styles.geoHealthWrap}>
        <span className={`${styles.healthBadge} ${toneClass(row.health)}`}>{row.roas.toFixed(1)}x</span>
      </div>
    </div>
  );
}

function FunnelChart({ stages, costPerConversion }: { stages: FunnelStage[]; costPerConversion: number | null }) {
  const max = stages[0]?.value ?? 1;
  const icons: Record<string, ReactNode> = {
    eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    cursor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z" /></svg>,
    check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
  };
  return (
    <div className={styles.funnel}>
      {stages.map((stage, i) => {
        const pct = max > 0 ? (stage.value / max) * 100 : 0;
        return (
          <div key={stage.label}>
            <div className={styles.funnelStage}>
              <div className={`${styles.stageIcon} ${stageIconClass(stage.icon)}`}>{icons[stage.icon]}</div>
              <div className={styles.stageBody}>
                <div className={styles.stageTop}>
                  <span className={styles.stageLabel}>{stage.label}</span>
                  <div className={styles.stageMeta}>
                    {stage.rate !== null && <span className={`${styles.rateBadge} ${stageIconClass(stage.icon)}`}>{stage.rateLabel}: {stage.rate}%</span>}
                    <span className={styles.stageValue}>
                      {stage.value >= 1000000 ? `${(stage.value / 1000000).toFixed(1)}M` : stage.value >= 1000 ? `${(stage.value / 1000).toFixed(1)}K` : stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <svg className={styles.stageBar} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id={`stage-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={stage.color} />
                      <stop offset="100%" stopColor={stage.color} stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <rect width="100" height="8" rx="4" fill="var(--border)" />
                  <rect width={pct} height="8" rx="4" fill={`url(#stage-${i})`} />
                </svg>
              </div>
            </div>
            {i < stages.length - 1 && <div className={styles.funnelArrow}><svg width="12" height="10" viewBox="0 0 12 10" fill="var(--t3)"><path d="M6 10L0 0h12z" /></svg></div>}
          </div>
        );
      })}
      {costPerConversion !== null && (
        <div className={styles.costBox}>
          <span className={styles.costLabel}>Cost per Conversion</span>
          <span className={styles.costValue}>${costPerConversion.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />
    </div>
  );
}

function PanelTitle({ title, subtitle, compact = false }: { title: string; subtitle: string; compact?: boolean }) {
  return (
    <>
      <h3 className={compact ? styles.panelTitleSmall : styles.panelTitle}>{title}</h3>
      <p className={compact ? styles.panelSubtitleTight : styles.panelSubtitle}>{subtitle}</p>
    </>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className={styles.emptyState}>{children}</p>;
}

function metricBadgeClass(value: number) {
  if (value >= 3) return styles.toneGood;
  if (value >= 1.5) return styles.toneWarning;
  return styles.tonePoor;
}

function ctrBadgeClass(value: number) {
  if (value >= 2) return styles.toneGood;
  if (value >= 1) return styles.toneWarning;
  return styles.tonePoor;
}

export default function DashboardEnhanced({ brandId, platform, dateFrom, dateTo }: Props) {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [comparison, setComparison] = useState<Record<string, Comparison> | null>(null);
  const [alertDays, setAlertDays] = useState<AlertDay[]>([]);
  const [alertSummary, setAlertSummary] = useState<Record<string, number>>({});
  const [funnel, setFunnel] = useState<{ stages: FunnelStage[]; costPerConversion: number | null } | null>(null);
  const [platformDonut, setPlatformDonut] = useState<PlatformDonut[]>([]);
  const [campaignDonut, setCampaignDonut] = useState<CampaignDonut[]>([]);
  const [geo, setGeo] = useState<GeoRowData[]>([]);
  const [convTrend, setConvTrend] = useState<ConvTrend[]>([]);
  const [biLoading, setBiLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const singlePlatform = platform !== "";
  const token = () => sessionStorage.getItem("access_token") ?? "";

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const params = new URLSearchParams({ brandId });
      if (platform) params.set("platform", platform);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const headers = { Authorization: `Bearer ${token()}` };
      const [trendsRes, alertsRes] = await Promise.all([
        fetch(`/api/analytics/trends?${params}`, { headers, credentials: "include" }),
        fetch(`/api/analytics/alert-trends?brandId=${brandId}`, { headers, credentials: "include" }),
      ]);
      if (trendsRes.ok) { const d = await trendsRes.json(); setTrends(d.metricsOverTime ?? []); setComparison(d.comparison ?? null); }
      if (alertsRes.ok) { const d = await alertsRes.json(); setAlertDays(d.alertsPerDay ?? []); setAlertSummary(d.summary ?? {}); }
    } catch {}
    finally { setTrendsLoading(false); }
  }, [brandId, platform, dateFrom, dateTo]);

  const fetchBI = useCallback(async () => {
    setBiLoading(true);
    try {
      const params = new URLSearchParams({ brandId });
      if (platform) params.set("platform", platform);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const headers = { Authorization: `Bearer ${token()}` };
      const res = await fetch(`/api/analytics/bi-summary?${params}`, { headers, credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setFunnel(d.funnel ?? null); setPlatformDonut(d.platformDonut ?? []);
        setCampaignDonut(d.campaignDonut ?? []); setGeo(d.geo ?? []); setConvTrend(d.conversionTrend ?? []);
      }
    } catch {}
    finally { setBiLoading(false); }
  }, [brandId, platform, dateFrom, dateTo]);

  useEffect(() => { fetchTrends(); fetchBI(); }, [fetchTrends, fetchBI]);

  const maxGeoSpend = geo.length > 0 ? geo[0].spend : 1;

  return (
    <div className={styles.root}>
      {comparison && (
        <>
          <SectionDivider title="Period Comparison" subtitle="Current vs previous period - same duration" />
          <div className={styles.comparisonGrid}>
            {[
              { label: "Avg ROAS", key: "roas", prefix: "", suffix: "x", inverse: false },
              { label: "Avg CTR", key: "ctr", prefix: "", suffix: "%", inverse: false },
              { label: "Avg CPC", key: "cpc", prefix: "$", suffix: "", inverse: true },
              { label: "Total Spend", key: "spend", prefix: "$", suffix: "", inverse: true },
              { label: "Conversions", key: "conversions", prefix: "", suffix: "", inverse: false },
            ].map(({ label, key, prefix, suffix, inverse }) => {
              const c = comparison[key]; if (!c) return null;
              return (
                <div key={key} className={styles.card}>
                  <p className={styles.kpiLabel}>{label}</p>
                  <div className={styles.comparisonValue}>
                    {prefix}{c.current >= 1000 ? `${(c.current / 1000).toFixed(1)}k` : c.current.toFixed(2)}{suffix}
                  </div>
                  <div className={styles.compareRow}>
                    <PctBadge change={c.change} inverse={inverse} />
                    <span className={styles.mutedSmall}>vs prev</span>
                  </div>
                  <p className={styles.previousValue}>
                    Prev: {prefix}{c.previous >= 1000 ? `${(c.previous / 1000).toFixed(1)}k` : c.previous.toFixed(2)}{suffix}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionDivider title="Conversion Funnel & Platform Mix" subtitle="ETL-powered - extracted from PerformanceFact" />
      <div className={styles.funnelGrid}>
        <div className={styles.card}>
          <PanelTitle title="Conversion Funnel" subtitle="Impressions -> Clicks -> Conversions" />
          {biLoading ? <Spinner /> : funnel
            ? <FunnelChart stages={funnel.stages} costPerConversion={funnel.costPerConversion} />
            : <EmptyState>No funnel data</EmptyState>}
        </div>
        <div className={styles.card}>
          <PanelTitle title="Platform Split" subtitle="Spend distribution by channel" compact />
          {biLoading ? <Spinner /> : platformDonut.length > 0 ? (
            <>
              <DonutChart data={platformDonut} valueKey="spend" labelKey="label" colorKey="color" formatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`} />
              <div className={styles.platformList}>
                {platformDonut.map(p => (
                  <div key={p.platform} className={styles.platformRow}>
                    <svg className={styles.platformDot} viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill={p.color} /></svg>
                    <span className={styles.platformName}>{p.label}</span>
                    <span className={styles.platformSpend}>${p.spend >= 1000 ? `${(p.spend / 1000).toFixed(1)}k` : p.spend.toFixed(0)}</span>
                    <span className={`${styles.platformShare} ${platformClass(p.platform)}`}>{p.share}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState>No platform data</EmptyState>}
        </div>
      </div>

      <div className={styles.campaignGrid}>
        <div className={styles.card}>
          <PanelTitle title="Spend by Campaign" subtitle="Top 8 campaigns" compact />
          {biLoading ? <Spinner /> : campaignDonut.length > 0 ? (
            <>
              <DonutChart data={campaignDonut} valueKey="spend" labelKey="campaign" colorKey="color" formatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`} />
              <div className={styles.campaignList}>
                {campaignDonut.map((c, i) => (
                  <div key={i} className={styles.campaignRow}>
                    <svg className={styles.campaignDot} viewBox="0 0 8 8" aria-hidden="true"><rect width="8" height="8" rx="2" fill={c.color} /></svg>
                    <span className={styles.campaignName}>{c.campaign}</span>
                    <span className={styles.campaignShare}>{c.share}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState>No campaign data</EmptyState>}
        </div>
        <div className={styles.card}>
          <PanelTitle title="Conversion Trend" subtitle="Daily funnel volume over time" />
          {biLoading ? <Spinner /> : convTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={convTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gImpr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5865f2" stopOpacity={0.12} /><stop offset="95%" stopColor="#5865f2" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gClk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3fb950" stopOpacity={0.2} /><stop offset="95%" stopColor="#3fb950" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: number | string) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v} />
                <Tooltip {...tooltipStyle} formatter={(v: number | string, name: string | number) => [Number(v).toLocaleString(), name]} labelFormatter={fmtDate} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#5865f2" strokeWidth={1.5} fill="url(#gImpr)" dot={false} />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#gClk)" dot={false} />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#3fb950" strokeWidth={2} fill="url(#gConv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState>No trend data</EmptyState>}
        </div>
      </div>

      {!biLoading && geo.length > 0 && (
        <>
          <SectionDivider title="Performance by Country" subtitle="Spend share, conversions and ROAS per geography" />
          <div className={styles.card}>
            <div className={styles.geoHeader}>
              {["#", "Country", "Spend", "Share", "Conv.", "ROAS"].map(h => (
                <span key={h} className={h === "Country" || h === "#" ? styles.geoHeadLeft : styles.geoHeadRight}>{h}</span>
              ))}
            </div>
            <div className={styles.geoList}>
              {geo.map((row, i) => <GeoRow key={row.country} row={row} maxSpend={maxGeoSpend} index={i} />)}
            </div>
          </div>
        </>
      )}

      {!trendsLoading && trends.length > 0 && (
        <>
          <SectionDivider title="Metric Trends" subtitle="Google vs Meta vs previous period - 3 dimensions per chart" />

          <div className={`${styles.card} ${styles.cardSpaced}`}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.panelTitleNoMargin}>ROAS Over Time</h3>
                <p className={styles.panelDescription}>Return on Ad Spend - Google vs Meta vs previous period</p>
              </div>
              <span className={styles.daysCount}>{trends.length} days</span>
            </div>
            <ChartLegend items={
              singlePlatform
                ? [{ color: "#5865f2", label: "ROAS" }, { color: PREV_COLOR, label: "Prev. period", dashed: true }]
                : [{ color: GOOGLE_COLOR, label: "Google ROAS" }, { color: META_COLOR, label: "Meta ROAS", dashed: true }, { color: PREV_COLOR, label: "Prev. period", dashed: true }]
            } />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: number | string) => `${v}x`} />
                <Tooltip {...tooltipStyle} formatter={(v: number | string, name?: string | number) => [`${Number(v).toFixed(2)}x`, name ?? ""]} labelFormatter={fmtDate} />
                {singlePlatform ? (
                  <Line type="monotone" dataKey="roas" name="ROAS" stroke="#5865f2" strokeWidth={2} dot={false} connectNulls />
                ) : (
                  <>
                    <Line type="monotone" dataKey="roas_google" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="roas_meta" name="Meta" stroke={META_COLOR} strokeWidth={2} dot={false} connectNulls strokeDasharray="6 3" />
                  </>
                )}
                <Line type="monotone" dataKey="roas_prev" name="Prev. period" stroke={PREV_COLOR} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" opacity={0.55} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.twoColumnGrid}>
            <div className={styles.card}>
              <PanelTitle title="CTR Over Time" subtitle="Click-through rate - by platform" compact />
              <ChartLegend items={
                singlePlatform
                  ? [{ color: CTR_COLOR, label: "CTR" }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
                  : [{ color: GOOGLE_COLOR, label: "Google" }, { color: META_COLOR, label: "Meta", dashed: true }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
              } />
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: number | string) => `${v}%`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number | string, name?: string | number) => [`${Number(v).toFixed(2)}%`, name ?? ""]} labelFormatter={fmtDate} />
                  {singlePlatform ? (
                    <Line type="monotone" dataKey="ctr" name="CTR" stroke={CTR_COLOR} strokeWidth={2} dot={false} connectNulls />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="ctr_google" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="ctr_meta" name="Meta" stroke={META_COLOR} strokeWidth={2} dot={false} connectNulls strokeDasharray="6 3" />
                    </>
                  )}
                  <Line type="monotone" dataKey="ctr_prev" name="Prev." stroke={PREV_COLOR} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" opacity={0.55} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.card}>
              <PanelTitle title="CPC Over Time" subtitle="Cost per click - by platform" compact />
              <ChartLegend items={
                singlePlatform
                  ? [{ color: CPC_COLOR, label: "CPC" }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
                  : [{ color: GOOGLE_COLOR, label: "Google" }, { color: META_COLOR, label: "Meta", dashed: true }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
              } />
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: number | string) => `$${v}`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number | string, name?: string | number) => [`$${Number(v).toFixed(2)}`, name ?? ""]} labelFormatter={fmtDate} />
                  {singlePlatform ? (
                    <Line type="monotone" dataKey="cpc" name="CPC" stroke={CPC_COLOR} strokeWidth={2} dot={false} connectNulls />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="cpc_google" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="cpc_meta" name="Meta" stroke={META_COLOR} strokeWidth={2} dot={false} connectNulls strokeDasharray="6 3" />
                    </>
                  )}
                  <Line type="monotone" dataKey="cpc_prev" name="Prev." stroke={PREV_COLOR} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" opacity={0.55} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {alertDays.length > 0 && (
            <div className={`${styles.card} ${styles.cardSpaced}`}>
              <div className={styles.alertHeader}>
                <div>
                  <h3 className={styles.panelTitleNoMarginSmall}>Alert Trends</h3>
                  <p className={styles.panelDescription}>Alert activity - last 30 days</p>
                </div>
                <div className={styles.alertStats}>
                  {[{ label: "Open", value: alertSummary.open ?? 0, tone: styles.statOpen }, { label: "Resolved", value: alertSummary.resolved ?? 0, tone: styles.statResolved }, { label: "Total", value: alertSummary.total ?? 0, tone: "" }].map(s => (
                    <div key={s.label} className={styles.alertStat}>
                      <div className={`${styles.alertStatValue} ${s.tone}`}>{s.value}</div>
                      <div className={styles.alertStatLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={alertDays} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} labelFormatter={fmtDate} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                  <Bar dataKey="critical" name="Critical" stackId="a" fill="#f85149" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="warning" name="Warning" stackId="a" fill="#d29922" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className={styles.card}>
            <PanelTitle title="Metric Breakdown" subtitle="Last 10 days - Google vs Meta per metric" compact />
            <div className={styles.tableWrap}>
              <table className={styles.metricTable}>
                <thead>
                  <tr>
                    {["Date", "ROAS (G)", "ROAS (M)", "CTR (G)", "CTR (M)", "CPC (G)", "CPC (M)", "Spend"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...trends].reverse().slice(0, 10).map((row, i) => {
                    const rg = row.roas_google ?? 0, rm = row.roas_meta ?? 0;
                    const cg = row.ctr_google ?? 0, cm = row.ctr_meta ?? 0;
                    return (
                      <tr key={`${row.date}-${i}`}>
                        <td className={styles.dateCell}>{new Date(row.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td>{row.roas_google !== null ? <span className={`${styles.metricBadge} ${metricBadgeClass(rg)}`}>{rg.toFixed(2)}x</span> : <span className={styles.emptyValue}>—</span>}</td>
                        <td>{row.roas_meta !== null ? <span className={`${styles.metricBadge} ${metricBadgeClass(rm)}`}>{rm.toFixed(2)}x</span> : <span className={styles.emptyValue}>—</span>}</td>
                        <td>{row.ctr_google !== null ? <span className={`${styles.metricBadge} ${ctrBadgeClass(cg)}`}>{cg.toFixed(2)}%</span> : <span className={styles.emptyValue}>—</span>}</td>
                        <td>{row.ctr_meta !== null ? <span className={`${styles.metricBadge} ${ctrBadgeClass(cm)}`}>{cm.toFixed(2)}%</span> : <span className={styles.emptyValue}>—</span>}</td>
                        <td className={styles.googleCell}>{row.cpc_google !== null ? `$${row.cpc_google.toFixed(2)}` : "—"}</td>
                        <td className={styles.metaCell}>{row.cpc_meta !== null ? `$${row.cpc_meta.toFixed(2)}` : "—"}</td>
                        <td className={styles.spendCell}>${row.spend.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
