"use client";
import { useEffect, useState, useCallback, type CSSProperties, type ReactNode } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendData {
  date: string;
  roas: number; ctr: number; cpc: number;
  spend: number; clicks: number; conversions: number;
  roas_google: number | null; roas_meta: number | null;
  ctr_google:  number | null; ctr_meta:  number | null;
  cpc_google:  number | null; cpc_meta:  number | null;
  spend_google:  number | null; spend_meta:  number | null;
  clicks_google: number | null; clicks_meta: number | null;
  conversions_google: number | null; conversions_meta: number | null;
  roas_prev: number | null; ctr_prev: number | null;
  cpc_prev:  number | null; spend_prev: number | null;
  clicks_prev: number | null; conversions_prev: number | null;
}

interface Comparison { current: number; previous: number; change: number | null; }
interface AlertDay { date: string; total: number; open: number; acknowledged: number; resolved: number; critical: number; warning: number; }
interface FunnelStage { label: string; value: number; icon: string; color: string; rate: number | null; rateLabel?: string; }
interface PlatformDonut { platform: string; label: string; color: string; spend: number; clicks: number; impressions: number; conversions: number; roas: number; share: number; }
interface CampaignDonut { campaign: string; platform: string; spend: number; clicks: number; roas: number; share: number; color: string; }
interface GeoRow { country: string; spend: number; clicks: number; conversions: number; roas: number; share: number; health: "good" | "warning" | "poor"; }
interface ConvTrend { date: string; impressions: number; clicks: number; conversions: number; }

interface Props { brandId: string; platform: string; dateFrom: string; dateTo: string; }

// ─── Colors ───────────────────────────────────────────────────────────────────

const GOOGLE_COLOR = "#4285F4";
const META_COLOR   = "#1877F2";
const PREV_COLOR   = "#888780";
const CTR_COLOR    = "#8b5cf6";
const CPC_COLOR    = "#f59e0b";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const card: CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "16px", padding: "22px",
};

const tooltipStyle = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" },
};

const fmtDate = (d: any): string =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─── ChartLegend ─────────────────────────────────────────────────────────────

function ChartLegend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "12px" }}>
      {items.map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <svg width="18" height="6">
            <line x1="0" y1="3" x2="18" y2="3" stroke={item.color} strokeWidth="2" strokeDasharray={item.dashed ? "4 3" : undefined} />
          </svg>
          <span style={{ fontSize: "11px", color: "var(--t2)", fontWeight: "500" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────

function SectionDivider({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "36px 0 20px" }}>
      <div style={{ width: "4px", height: "28px", borderRadius: "2px", background: "linear-gradient(135deg,#5865f2,#818cf8)" }} />
      <div>
        <h2 style={{ fontSize: "17px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "12px", color: "var(--t3)", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── PctBadge ────────────────────────────────────────────────────────────────

function PctBadge({ change, inverse = false }: { change: number | null; inverse?: boolean }) {
  if (change === null) return <span style={{ fontSize: "12px", color: "var(--t3)" }}>—</span>;
  const positive = inverse ? change < 0 : change > 0;
  const color = positive ? "#3fb950" : "#f85149";
  return (
    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {change > 0 ? "+" : ""}{change}%
    </span>
  );
}

// ─── DonutChart ──────────────────────────────────────────────────────────────

function DonutChart({ data, valueKey, labelKey, colorKey, formatter }: {
  data: any[]; valueKey: string; labelKey: string; colorKey: string; formatter: (v: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const renderPieShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const isActive = props.index === activeIndex;
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={isActive ? innerRadius - 4 : innerRadius} outerRadius={isActive ? outerRadius + 6 : outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        {isActive && <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--t1)" fontSize={13} fontWeight={700}>
          {payload[labelKey].length > 14 ? payload[labelKey].slice(0, 14) + "…" : payload[labelKey]}
        </text>}
        {isActive && <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--t2)" fontSize={12}>{formatter(payload[valueKey])}</text>}
        {isActive && <text x={cx} y={cy + 26} textAnchor="middle" fill="var(--t3)" fontSize={11}>{payload.share}%</text>}
      </g>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={labelKey} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
          shape={renderPieShape}
          onMouseEnter={(_, i) => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)} paddingAngle={2}>
          {data.map((entry, i) => <Cell key={i} fill={entry[colorKey]} stroke="transparent" />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle.contentStyle} formatter={(v: any) => [formatter(Number(v))]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── GeoRow ──────────────────────────────────────────────────────────────────

function GeoRow({ row, maxSpend, index }: { row: GeoRow; maxSpend: number; index: number }) {
  const healthColor = row.health === "good" ? "#3fb950" : row.health === "warning" ? "#d29922" : "#f85149";
  const pct = maxSpend > 0 ? (row.spend / maxSpend) * 100 : 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 70px 70px 60px", gap: "10px", alignItems: "center", padding: "10px 14px", borderRadius: "10px", background: index % 2 === 0 ? "var(--bg)" : "transparent", border: index % 2 === 0 ? "1px solid var(--border)" : "1px solid transparent" }}>
      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--t3)", textAlign: "center" }}>{index + 1}</span>
      <div>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>{row.country}</div>
        <div style={{ height: "4px", borderRadius: "2px", background: "var(--border)" }}>
          <div style={{ height: "100%", borderRadius: "2px", width: `${pct}%`, background: "#5865f2", transition: "width 0.6s ease" }} />
        </div>
      </div>
      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--t1)", textAlign: "right" }}>${row.spend >= 1000 ? `${(row.spend/1000).toFixed(1)}k` : row.spend.toFixed(0)}</span>
      <span style={{ fontSize: "12px", color: "var(--t2)", textAlign: "right" }}>{row.share}%</span>
      <span style={{ fontSize: "12px", color: "var(--t2)", textAlign: "right" }}>{row.conversions.toLocaleString()}</span>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: `${healthColor}15`, color: healthColor, border: `1px solid ${healthColor}30` }}>{row.roas.toFixed(1)}x</span>
      </div>
    </div>
  );
}

// ─── FunnelChart ─────────────────────────────────────────────────────────────

function FunnelChart({ stages, costPerConversion }: { stages: FunnelStage[]; costPerConversion: number | null }) {
  const max = stages[0]?.value ?? 1;
  const icons: Record<string, ReactNode> = {
    eye:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    cursor: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/></svg>,
    check:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {stages.map((stage, i) => {
        const pct = max > 0 ? (stage.value / max) * 100 : 0;
        return (
          <div key={stage.label}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "9px", flexShrink: 0, background: `${stage.color}18`, color: stage.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{icons[stage.icon]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{stage.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {stage.rate !== null && <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", background: `${stage.color}15`, color: stage.color }}>{stage.rateLabel}: {stage.rate}%</span>}
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>
                      {stage.value >= 1000000 ? `${(stage.value/1000000).toFixed(1)}M` : stage.value >= 1000 ? `${(stage.value/1000).toFixed(1)}K` : stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "4px", width: `${pct}%`, background: `linear-gradient(90deg,${stage.color},${stage.color}99)`, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
                </div>
              </div>
            </div>
            {i < stages.length - 1 && <div style={{ display: "flex", justifyContent: "center", marginBottom: "2px" }}><svg width="12" height="10" viewBox="0 0 12 10" fill="var(--t3)"><path d="M6 10L0 0h12z"/></svg></div>}
          </div>
        );
      })}
      {costPerConversion !== null && (
        <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: "rgba(88,101,242,0.06)", border: "1px solid rgba(88,101,242,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--t2)", fontWeight: "500" }}>Cost per Conversion</span>
          <span style={{ fontSize: "16px", fontWeight: "700", color: "#5865f2" }}>${costPerConversion.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function DashboardEnhanced({ brandId, platform, dateFrom, dateTo }: Props) {

  const [trends,        setTrends]        = useState<TrendData[]>([]);
  const [comparison,    setComparison]    = useState<Record<string, Comparison> | null>(null);
  const [alertDays,     setAlertDays]     = useState<AlertDay[]>([]);
  const [alertSummary,  setAlertSummary]  = useState<Record<string, number>>({});
  const [funnel,        setFunnel]        = useState<{ stages: FunnelStage[]; costPerConversion: number | null } | null>(null);
  const [platformDonut, setPlatformDonut] = useState<PlatformDonut[]>([]);
  const [campaignDonut, setCampaignDonut] = useState<CampaignDonut[]>([]);
  const [geo,           setGeo]           = useState<GeoRow[]>([]);
  const [convTrend,     setConvTrend]     = useState<ConvTrend[]>([]);
  const [biLoading,     setBiLoading]     = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);

  // When a single platform is selected, show unified lines (not split)
  const singlePlatform = platform !== "";

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const params = new URLSearchParams({ brandId });
      if (platform) params.set("platform", platform);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo)   params.set("dateTo",   dateTo);
      const headers = { Authorization: `Bearer ${token()}` };
      const [trendsRes, alertsRes] = await Promise.all([
        fetch(`/api/analytics/trends?${params}`,                { headers, credentials: "include" }),
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
      if (dateTo)   params.set("dateTo",   dateTo);
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
  const Spinner = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "120px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ marginTop: "32px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ════ SECTION A: Period Comparison cards ════ */}
      {comparison && (
        <>
          <SectionDivider title="Period Comparison" subtitle="Current vs previous period — same duration" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", marginBottom: "8px" }}>
            {[
              { label: "Avg ROAS",    key: "roas",        prefix: "",  suffix: "x", inverse: false },
              { label: "Avg CTR",     key: "ctr",         prefix: "",  suffix: "%", inverse: false },
              { label: "Avg CPC",     key: "cpc",         prefix: "$", suffix: "",  inverse: true  },
              { label: "Total Spend", key: "spend",       prefix: "$", suffix: "",  inverse: true  },
              { label: "Conversions", key: "conversions", prefix: "",  suffix: "",  inverse: false },
            ].map(({ label, key, prefix, suffix, inverse }) => {
              const c = comparison[key]; if (!c) return null;
              return (
                <div key={key} style={card}>
                  <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>{label}</p>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "6px" }}>
                    {prefix}{c.current >= 1000 ? `${(c.current/1000).toFixed(1)}k` : c.current.toFixed(2)}{suffix}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <PctBadge change={c.change} inverse={inverse} />
                    <span style={{ fontSize: "11px", color: "var(--t3)" }}>vs prev</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--t3)" }}>
                    Prev: {prefix}{c.previous >= 1000 ? `${(c.previous/1000).toFixed(1)}k` : c.previous.toFixed(2)}{suffix}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════ SECTION B: Funnel + Platform Donut ════ */}
      <SectionDivider title="Conversion Funnel & Platform Mix" subtitle="ETL-powered — extracted from PerformanceFact" />
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px", marginBottom: "16px" }}>
        <div style={card}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", margin: "0 0 4px" }}>Conversion Funnel</h3>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "16px" }}>Impressions → Clicks → Conversions</p>
          {biLoading ? <Spinner /> : funnel
            ? <FunnelChart stages={funnel.stages} costPerConversion={funnel.costPerConversion} />
            : <p style={{ fontSize: "13px", color: "var(--t3)", textAlign: "center", padding: "24px 0" }}>No funnel data</p>}
        </div>
        <div style={card}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", margin: "0 0 4px" }}>Platform Split</h3>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "4px" }}>Spend distribution by channel</p>
          {biLoading ? <Spinner /> : platformDonut.length > 0 ? (
            <>
              <DonutChart data={platformDonut} valueKey="spend" labelKey="label" colorKey="color" formatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                {platformDonut.map(p => (
                  <div key={p.platform} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--t1)", fontWeight: "600", flex: 1 }}>{p.label}</span>
                    <span style={{ fontSize: "12px", color: "var(--t2)" }}>${p.spend >= 1000 ? `${(p.spend/1000).toFixed(1)}k` : p.spend.toFixed(0)}</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: p.color }}>{p.share}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ fontSize: "13px", color: "var(--t3)", textAlign: "center", padding: "24px 0" }}>No platform data</p>}
        </div>
      </div>

      {/* Campaign Donut + Conversion Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={card}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", margin: "0 0 4px" }}>Spend by Campaign</h3>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "4px" }}>Top 8 campaigns</p>
          {biLoading ? <Spinner /> : campaignDonut.length > 0 ? (
            <>
              <DonutChart data={campaignDonut} valueKey="spend" labelKey="campaign" colorKey="color" formatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px", maxHeight: "140px", overflowY: "auto" }}>
                {campaignDonut.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: "var(--t2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign}</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--t1)" }}>{c.share}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ fontSize: "13px", color: "var(--t3)", textAlign: "center", padding: "24px 0" }}>No campaign data</p>}
        </div>
        <div style={card}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", margin: "0 0 4px" }}>Conversion Trend</h3>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "16px" }}>Daily funnel volume over time</p>
          {biLoading ? <Spinner /> : convTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={convTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gImpr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5865f2" stopOpacity={0.12}/><stop offset="95%" stopColor="#5865f2" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gClk"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.12}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3fb950" stopOpacity={0.2}/><stop offset="95%" stopColor="#3fb950" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [Number(v).toLocaleString(), name]} labelFormatter={fmtDate} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#5865f2" strokeWidth={1.5} fill="url(#gImpr)" dot={false} />
                <Area type="monotone" dataKey="clicks"      name="Clicks"      stroke="#8b5cf6" strokeWidth={1.5} fill="url(#gClk)"  dot={false} />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#3fb950" strokeWidth={2}   fill="url(#gConv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p style={{ fontSize: "13px", color: "var(--t3)", textAlign: "center", padding: "24px 0" }}>No trend data</p>}
        </div>
      </div>

      {/* Geo table */}
      {!biLoading && geo.length > 0 && (
        <>
          <SectionDivider title="Performance by Country" subtitle="Spend share, conversions and ROAS per geography" />
          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 90px 70px 70px 60px", gap: "10px", padding: "6px 14px 10px", borderBottom: "1px solid var(--border)", marginBottom: "8px" }}>
              {["#","Country","Spend","Share","Conv.","ROAS"].map(h => (
                <span key={h} style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.6px", textAlign: h === "Country" || h === "#" ? "left" : "right" }}>{h}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {geo.map((row, i) => <GeoRow key={row.country} row={row} maxSpend={maxGeoSpend} index={i} />)}
            </div>
          </div>
        </>
      )}

      {/* ════ SECTION C: MULTIDIMENSIONAL METRIC TRENDS ════ */}
      {!trendsLoading && trends.length > 0 && (
        <>
          <SectionDivider title="Metric Trends" subtitle="Google vs Meta vs previous period — 3 dimensions per chart" />

          {/* ROAS — 3 lines */}
          <div style={{ ...card, marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", margin: 0 }}>ROAS Over Time</h3>
                <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>Return on Ad Spend — Google vs Meta vs previous period</p>
              </div>
              <span style={{ fontSize: "11px", color: "var(--t3)" }}>{trends.length} days</span>
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
                <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${v}x`} />
                <Tooltip {...tooltipStyle} formatter={(v: any, name?: string | number) => [`${Number(v).toFixed(2)}x`, name ?? ""]} labelFormatter={fmtDate} />
                {singlePlatform ? (
                  <Line type="monotone" dataKey="roas" name="ROAS" stroke="#5865f2" strokeWidth={2} dot={false} connectNulls />
                ) : (
                  <>
                    <Line type="monotone" dataKey="roas_google" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="roas_meta"   name="Meta"   stroke={META_COLOR}   strokeWidth={2} dot={false} connectNulls strokeDasharray="6 3" />
                  </>
                )}
                <Line type="monotone" dataKey="roas_prev" name="Prev. period" stroke={PREV_COLOR} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" opacity={0.55} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CTR + CPC — each with 3 lines */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div style={card}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", margin: "0 0 2px" }}>CTR Over Time</h3>
              <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "6px" }}>Click-through rate — by platform</p>
              <ChartLegend items={
                singlePlatform
                  ? [{ color: CTR_COLOR, label: "CTR" }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
                  : [{ color: GOOGLE_COLOR, label: "Google" }, { color: META_COLOR, label: "Meta", dashed: true }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
              } />
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${v}%`} />
                  <Tooltip {...tooltipStyle} formatter={(v: any, name?: string | number) => [`${Number(v).toFixed(2)}%`, name ?? ""]} labelFormatter={fmtDate} />
                  {singlePlatform ? (
                    <Line type="monotone" dataKey="ctr" name="CTR" stroke={CTR_COLOR} strokeWidth={2} dot={false} connectNulls />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="ctr_google" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="ctr_meta"   name="Meta"   stroke={META_COLOR}   strokeWidth={2} dot={false} connectNulls strokeDasharray="6 3" />
                    </>
                  )}
                  <Line type="monotone" dataKey="ctr_prev" name="Prev." stroke={PREV_COLOR} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" opacity={0.55} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={card}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", margin: "0 0 2px" }}>CPC Over Time</h3>
              <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "6px" }}>Cost per click — by platform</p>
              <ChartLegend items={
                singlePlatform
                  ? [{ color: CPC_COLOR, label: "CPC" }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
                  : [{ color: GOOGLE_COLOR, label: "Google" }, { color: META_COLOR, label: "Meta", dashed: true }, { color: PREV_COLOR, label: "Prev.", dashed: true }]
              } />
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `$${v}`} />
                  <Tooltip {...tooltipStyle} formatter={(v: any, name?: string | number) => [`$${Number(v).toFixed(2)}`, name ?? ""]} labelFormatter={fmtDate} />
                  {singlePlatform ? (
                    <Line type="monotone" dataKey="cpc" name="CPC" stroke={CPC_COLOR} strokeWidth={2} dot={false} connectNulls />
                  ) : (
                    <>
                      <Line type="monotone" dataKey="cpc_google" name="Google" stroke={GOOGLE_COLOR} strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="cpc_meta"   name="Meta"   stroke={META_COLOR}   strokeWidth={2} dot={false} connectNulls strokeDasharray="6 3" />
                    </>
                  )}
                  <Line type="monotone" dataKey="cpc_prev" name="Prev." stroke={PREV_COLOR} strokeWidth={1.5} dot={false} connectNulls strokeDasharray="4 4" opacity={0.55} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alert Trends */}
          {alertDays.length > 0 && (
            <div style={{ ...card, marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", margin: 0 }}>Alert Trends</h3>
                  <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "2px" }}>Alert activity — last 30 days</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[{ label: "Open", value: alertSummary.open ?? 0, color: "#5865f2" }, { label: "Resolved", value: alertSummary.resolved ?? 0, color: "#3fb950" }, { label: "Total", value: alertSummary.total ?? 0, color: "var(--t2)" }].map(s => (
                    <div key={s.label} style={{ textAlign: "center", padding: "7px 12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "600" }}>{s.label}</div>
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
                  <Bar dataKey="critical" name="Critical" stackId="a" fill="#f85149" radius={[0,0,0,0]} />
                  <Bar dataKey="warning"  name="Warning"  stackId="a" fill="#d29922" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Metric Breakdown Table — now with Google vs Meta columns */}
          <div style={card}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", margin: "0 0 4px" }}>Metric Breakdown</h3>
            <p style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "14px" }}>Last 10 days — Google vs Meta per metric</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {["Date","ROAS (G)","ROAS (M)","CTR (G)","CTR (M)","CPC (G)","CPC (M)","Spend"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: "10px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.6px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...trends].reverse().slice(0, 10).map((row, i) => {
                    const rg = row.roas_google ?? 0, rm = row.roas_meta ?? 0;
                    const cg = row.ctr_google  ?? 0, cm = row.ctr_meta  ?? 0;
                    const rgC = rg >= 3 ? "#3fb950" : rg >= 1.5 ? "#d29922" : "#f85149";
                    const rmC = rm >= 3 ? "#3fb950" : rm >= 1.5 ? "#d29922" : "#f85149";
                    const cgC = cg >= 2 ? "#3fb950" : cg >= 1   ? "#d29922" : "#f85149";
                    const cmC = cm >= 2 ? "#3fb950" : cm >= 1   ? "#d29922" : "#f85149";
                    return (
                      <tr key={`${row.date}-${i}`} style={{ borderBottom: i < 9 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.02)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <td style={{ padding: "9px 10px", color: "var(--t2)", fontWeight: "500" }}>{new Date(row.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td style={{ padding: "9px 10px" }}>{row.roas_google !== null ? <span style={{ padding: "2px 6px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: `${rgC}15`, color: rgC }}>{rg.toFixed(2)}x</span> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                        <td style={{ padding: "9px 10px" }}>{row.roas_meta   !== null ? <span style={{ padding: "2px 6px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: `${rmC}15`, color: rmC }}>{rm.toFixed(2)}x</span> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                        <td style={{ padding: "9px 10px" }}>{row.ctr_google  !== null ? <span style={{ padding: "2px 6px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: `${cgC}15`, color: cgC }}>{cg.toFixed(2)}%</span> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                        <td style={{ padding: "9px 10px" }}>{row.ctr_meta    !== null ? <span style={{ padding: "2px 6px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: `${cmC}15`, color: cmC }}>{cm.toFixed(2)}%</span> : <span style={{ color: "var(--t3)" }}>—</span>}</td>
                        <td style={{ padding: "9px 10px", color: GOOGLE_COLOR, fontWeight: "600" }}>{row.cpc_google !== null ? `$${row.cpc_google.toFixed(2)}` : "—"}</td>
                        <td style={{ padding: "9px 10px", color: META_COLOR,   fontWeight: "600" }}>{row.cpc_meta   !== null ? `$${row.cpc_meta.toFixed(2)}`   : "—"}</td>
                        <td style={{ padding: "9px 10px", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>${row.spend.toLocaleString()}</td>
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
