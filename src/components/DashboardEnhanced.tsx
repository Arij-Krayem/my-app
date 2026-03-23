"use client";
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface TrendData {
  date:        string;
  roas:        number;
  ctr:         number;
  cpc:         number;
  spend:       number;
  clicks:      number;
  conversions: number;
}

interface Comparison {
  current:  number;
  previous: number;
  change:   number | null;
}

interface AlertDay {
  date:         string;
  total:        number;
  open:         number;
  acknowledged: number;
  resolved:     number;
  critical:     number;
  warning:      number;
}

interface Props {
  brandId:  string;
  platform: string;
  dateFrom: string;
  dateTo:   string;
}

function PctBadge({ change, inverse = false }: { change: number | null; inverse?: boolean }) {
  if (change === null) return <span style={{ fontSize: "12px", color: "var(--t3)" }}>—</span>;
  const positive = inverse ? change < 0 : change > 0;
  const color    = positive ? "#3fb950" : "#f85149";
  const bg       = positive ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)";
  const border   = positive ? "rgba(63,185,80,0.25)" : "rgba(248,81,73,0.25)";
  return (
    <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: bg, color, border: `1px solid ${border}` }}>
      {change > 0 ? "+" : ""}{change}%
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: "13px", color: "var(--t2)" }}>{subtitle}</p>}
    </div>
  );
}

export default function DashboardEnhanced({ brandId, platform, dateFrom, dateTo }: Props) {
  const [trends,       setTrends]       = useState<TrendData[]>([]);
  const [comparison,   setComparison]   = useState<Record<string, Comparison> | null>(null);
  const [alertDays,    setAlertDays]    = useState<AlertDay[]>([]);
  const [alertSummary, setAlertSummary] = useState<Record<string, number>>({});
  const [loading,      setLoading]      = useState(true);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ brandId });
      if (platform) params.set("platform", platform);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo)   params.set("dateTo", dateTo);

      const headers = { Authorization: `Bearer ${token()}` };

      const [trendsRes, alertsRes] = await Promise.all([
        fetch(`/api/analytics/trends?${params}`,              { headers, credentials: "include" }),
        fetch(`/api/analytics/alert-trends?brandId=${brandId}`, { headers, credentials: "include" }),
      ]);

      if (trendsRes.ok) {
        const d = await trendsRes.json();
        setTrends(d.metricsOverTime ?? []);
        setComparison(d.comparison ?? null);
      }

      if (alertsRes.ok) {
        const d = await alertsRes.json();
        setAlertDays(d.alertsPerDay ?? []);
        setAlertSummary(d.summary ?? {});
      }
    } catch {}
    finally { setLoading(false); }
  }, [brandId, platform, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ✅ Explicit string return type fixes all labelFormatter errors
  const fmtDate = (d: any): string =>
    new Date(d + 'T12:00:00').toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const tooltipStyle = {
    contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" },
  };

  const card: React.CSSProperties = {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: "16px", padding: "22px",
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px", color: "var(--t2)" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
      <p style={{ fontSize: "13px" }}>Loading analytics…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (trends.length === 0) return null;

  return (
    <div style={{ marginTop: "32px" }}>

      {/* ── SECTION 1: KPI Comparison vs Previous Period ── */}
      {comparison && (
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader title="Period Comparison" subtitle="Current vs previous period performance" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            {[
              { label: "Avg ROAS",    key: "roas",        prefix: "",  suffix: "x", inverse: false },
              { label: "Avg CTR",     key: "ctr",         prefix: "",  suffix: "%", inverse: false },
              { label: "Avg CPC",     key: "cpc",         prefix: "$", suffix: "",  inverse: true  },
              { label: "Total Spend", key: "spend",       prefix: "$", suffix: "",  inverse: true  },
              { label: "Conversions", key: "conversions", prefix: "",  suffix: "",  inverse: false },
            ].map(({ label, key, prefix, suffix, inverse }) => {
              const c = comparison[key];
              if (!c) return null;
              return (
                <div key={key} style={card}>
                  <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</p>
                  <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--t1)", marginBottom: "6px" }}>
                    {prefix}{c.current >= 1000 ? `${(c.current / 1000).toFixed(1)}k` : c.current.toFixed(2)}{suffix}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <PctBadge change={c.change} inverse={inverse} />
                    <span style={{ fontSize: "11px", color: "var(--t3)" }}>vs prev period</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--t3)", marginTop: "6px" }}>
                    Prev: {prefix}{c.previous >= 1000 ? `${(c.previous / 1000).toFixed(1)}k` : c.previous.toFixed(2)}{suffix}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 2: ROAS Trend ── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)" }}>ROAS Over Time</h2>
            <p style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>Return on Ad Spend trend</p>
          </div>
          <span style={{ fontSize: "12px", color: "var(--t2)" }}>{trends.length} days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gRoas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#5865f2" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#5865f2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
            <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${v}x`} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(2)}x`, "ROAS"]} labelFormatter={(d: any) => fmtDate(d)} />
            <Area type="monotone" dataKey="roas" stroke="#5865f2" strokeWidth={2} fill="url(#gRoas)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── SECTION 3: CTR + CPC side by side ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div style={card}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>CTR Over Time</h2>
          <p style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "16px" }}>Click-through rate trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
              <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "CTR"]} labelFormatter={(d: any) => fmtDate(d)} />
              <Line type="monotone" dataKey="ctr" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>CPC Over Time</h2>
          <p style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "16px" }}>Cost per click trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
              <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "CPC"]} labelFormatter={(d: any) => fmtDate(d)} />
              <Line type="monotone" dataKey="cpc" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SECTION 4: Platform Comparison ── */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>Platform Comparison</h2>
        <p style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "16px" }}>Spend & Clicks daily breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
            <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={(v: any) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} labelFormatter={(d: any) => fmtDate(d)} />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
            <Bar dataKey="spend"  name="Spend"  fill="#5865f2" radius={[3, 3, 0, 0]} />
            <Bar dataKey="clicks" name="Clicks" fill="#818cf8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── SECTION 5: Alert Trends ── */}
      {alertDays.length > 0 && (
        <div style={{ ...card, marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>Alert Trends</h2>
              <p style={{ fontSize: "12px", color: "var(--t2)" }}>Alert activity over the last 30 days</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: "Open",     value: alertSummary.open     ?? 0, color: "#5865f2" },
                { label: "Resolved", value: alertSummary.resolved ?? 0, color: "#3fb950" },
                { label: "Total",    value: alertSummary.total    ?? 0, color: "var(--t2)" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "8px 14px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "600" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={alertDays} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} tickFormatter={fmtDate} />
              <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} labelFormatter={(d: any) => fmtDate(d)} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Bar dataKey="critical" name="Critical" stackId="a" fill="#f85149" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warning"  name="Warning"  stackId="a" fill="#d29922" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── SECTION 6: Metric Breakdown Table ── */}
      <div style={card}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>Metric Breakdown</h2>
        <p style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "16px" }}>Daily ROAS, CTR and CPC at a glance</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Date", "ROAS", "CTR", "CPC", "Spend", "Clicks", "Conversions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...trends].reverse().slice(0, 10).map((row, i) => {
                const roasColor = row.roas >= 3 ? "#3fb950" : row.roas >= 1.5 ? "#d29922" : "#f85149";
                const ctrColor  = row.ctr  >= 2 ? "#3fb950" : row.ctr  >= 1   ? "#d29922" : "#f85149";
                return (
                  <tr key={`${row.date}-${i}`} style={{ borderBottom: i < 9 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <td style={{ padding: "10px 12px", color: "var(--t2)", fontWeight: "500" }}>
                      {new Date(row.date + 'T12:00:00').toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "12px", fontWeight: "700", background: `${roasColor}15`, color: roasColor }}>
                        {row.roas.toFixed(2)}x
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "12px", fontWeight: "700", background: `${ctrColor}15`, color: ctrColor }}>
                        {row.ctr.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--t1)", fontWeight: "600" }}>${row.cpc.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>${row.spend.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", color: "var(--t2)" }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", color: "var(--t2)" }}>{row.conversions.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}