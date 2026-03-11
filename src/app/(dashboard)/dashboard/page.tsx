"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MOCK_ALERTS = [
  { id: 1, campaign: "Summer Sale Campaign", metric: "ROAS",  current: "2.1",   threshold: "3.0",   severity: "CRITICAL", ago: "2h ago",  platform: "Google" },
  { id: 2, campaign: "Brand Awareness Q3",   metric: "CTR",   current: "1.2%",  threshold: "2.0%",  severity: "WARNING",  ago: "4h ago",  platform: "Meta"   },
  { id: 3, campaign: "Product Launch",       metric: "CPC",   current: "$3.45", threshold: "$2.50", severity: "WARNING",  ago: "6h ago",  platform: "Google" },
];

const KPI_META = [
  { label: "Total Spend", key: "totalSpend", prefix: "$", suffix: "",  grad: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.2)",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: "Avg ROAS",    key: "avgRoas",    prefix: "",  suffix: "x", grad: "linear-gradient(135deg,#5865f2,#818cf8)", glow: "rgba(88,101,242,0.2)",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label: "Avg CTR",     key: "avgCtr",     prefix: "",  suffix: "%", grad: "linear-gradient(135deg,#8b5cf6,#a78bfa)", glow: "rgba(139,92,246,0.2)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { label: "Avg CPC",     key: "avgCpc",     prefix: "$", suffix: "",  grad: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.2)",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> },
];

const inputSt: React.CSSProperties = {
  padding: "8px 12px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "9px", color: "var(--t1)", fontSize: "13px", fontFamily: "inherit", outline: "none",
};

export default function DashboardPage() {
  const [user, setUser]             = useState<{ name: string } | null>(null);
  const [uploads, setUploads]       = useState<any[]>([]);
  const [analytics, setAnalytics]   = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [platform, setPlatform]     = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  const fetchAnalytics = (plat: string, from: string, to: string) => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    setKpiLoading(true);
    const p = new URLSearchParams({ brandId: "brand_visioad_001" });
    if (plat) p.set("platform", plat);
    if (from) p.set("dateFrom", from);
    if (to)   p.set("dateTo", to);
    fetch(`/api/analytics/kpis?${p}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.kpis) setAnalytics(d); })
      .catch(() => {})
      .finally(() => setKpiLoading(false));
  };

  useEffect(() => {
    const raw   = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("access_token");
    if (raw) setUser(JSON.parse(raw));
    if (!token) return;
    fetch("/api/uploads?pageSize=4", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setUploads(Array.isArray(d.items) ? d.items : []))
      .catch(() => {});
    fetchAnalytics("", "", "");
  }, []);

  const applyFilters = () => fetchAnalytics(platform, dateFrom, dateTo);
  const resetFilters = () => {
    setPlatform(""); setDateFrom(""); setDateTo("");
    fetchAnalytics("", "", "");
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const fmt = (val: number, prefix = "", suffix = "") => {
    if (val === undefined || val === null) return "—";
    const formatted = val >= 1000
      ? `${(val / 1000).toFixed(1)}k`
      : val.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return `${prefix}${formatted}${suffix}`;
  };

  const kpis             = analytics?.kpis;
  const platformBreakdown = analytics?.platformBreakdown ?? [];
  const spendOverTime    = analytics?.spendOverTime ?? [];
  const topCampaigns     = analytics?.topCampaigns ?? [];
  const totalSpend       = platformBreakdown.reduce((s: number, p: any) => s + Number(p.spend), 0);

  const chartData = Object.values(
    spendOverTime.reduce((acc: any, row: any) => {
      const d = String(row.date).split("T")[0];
      if (!acc[d]) acc[d] = { date: d, Google: 0, Meta: 0 };
      if (row.platform === "GOOGLE") acc[d].Google = Number(row.spend);
      if (row.platform === "META")   acc[d].Meta   = Number(row.spend);
      return acc;
    }, {})
  ) as { date: string; Google: number; Meta: number }[];

  const statusCfg = (s: string) => ({
    IMPORTED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)",  border: "rgba(63,185,80,0.25)"  },
    MAPPED:   { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
    PENDING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
    FAILED:   { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)"  },
  }[s] || { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" });

  const hasFilters = platform || dateFrom || dateTo;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>
            {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Here's your campaign performance overview.</p>
        </div>
        <Link href="/uploads/new" style={{ padding: "10px 18px", background: "linear-gradient(135deg,#5865f2,#818cf8)", borderRadius: "10px", color: "white", fontWeight: "600", fontSize: "13px", textDecoration: "none", boxShadow: "0 4px 14px rgba(88,101,242,0.35)", display: "flex", alignItems: "center", gap: "6px" }}>
          + New Upload
        </Link>
      </div>

      {/* Filter Bar */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>Filters</span>

        {/* Platform */}
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={inputSt}>
          <option value="">All Platforms</option>
          <option value="GOOGLE">Google Ads</option>
          <option value="META">Meta Ads</option>
        </select>

        {/* Date From */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--t3)" }}>From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputSt} />
        </div>

        {/* Date To */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--t3)" }}>To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputSt} />
        </div>

        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          {hasFilters && (
            <button onClick={resetFilters} style={{ padding: "8px 14px", borderRadius: "9px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
              Reset
            </button>
          )}
          <button onClick={applyFilters} style={{ padding: "8px 18px", borderRadius: "9px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px" }}>
            {kpiLoading ? <><div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />Loading...</> : "Apply"}
          </button>
        </div>

        {hasFilters && (
          <div style={{ width: "100%", display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
            {platform && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "5px", background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.25)", fontWeight: "600" }}>{platform === "GOOGLE" ? "Google Ads" : "Meta Ads"}</span>}
            {dateFrom && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "5px", background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.25)", fontWeight: "600" }}>From {dateFrom}</span>}
            {dateTo   && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "5px", background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.25)", fontWeight: "600" }}>To {dateTo}</span>}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {KPI_META.map(k => {
          const val = kpis ? fmt(Number(kpis[k.key]), k.prefix, k.suffix) : "—";
          return (
            <div key={k.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", position: "relative", overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${k.glow}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: k.glow, filter: "blur(20px)", pointerEvents: "none" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: k.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${k.glow}` }}>{k.icon}</div>
                {kpiLoading && <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />}
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--t1)", marginBottom: "3px", fontVariantNumeric: "tabular-nums", position: "relative" }}>
                {kpiLoading ? <span style={{ fontSize: "16px", color: "var(--t3)" }}>Loading...</span> : val}
              </div>
              <div style={{ fontSize: "13px", color: "var(--t2)", position: "relative" }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Spend Over Time Chart */}
      {chartData.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)" }}>Spend Over Time</h2>
            <span style={{ fontSize: "12px", color: "var(--t2)" }}>{chartData.length} days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gGoogle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4285F4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1877F2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false}
                tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }}
                formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()}`, name]}
                labelFormatter={l => new Date(l).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Area type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={2} fill="url(#gGoogle)" dot={false} />
              <Area type="monotone" dataKey="Meta"   stroke="#1877F2" strokeWidth={2} fill="url(#gMeta)"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px", marginBottom: "24px" }}>

        {/* Active Alerts */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)" }}>Active Alerts</h2>
              <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: "rgba(248,81,73,0.12)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
                {MOCK_ALERTS.filter(a => a.severity === "CRITICAL").length} critical
              </span>
            </div>
            <Link href="/alerts" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none", fontWeight: "500" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MOCK_ALERTS.map(a => {
              const isCrit = a.severity === "CRITICAL";
              return (
                <div key={a.id} style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--bg)", borderLeft: `3px solid ${isCrit ? "#f85149" : "#d29922"}`, border: `1px solid ${isCrit ? "rgba(248,81,73,0.15)" : "rgba(210,153,34,0.15)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{a.campaign}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", background: isCrit ? "rgba(248,81,73,0.12)" : "rgba(210,153,34,0.12)", color: isCrit ? "#f85149" : "#d29922", border: `1px solid ${isCrit ? "rgba(248,81,73,0.25)" : "rgba(210,153,34,0.25)"}` }}>{a.severity}</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--t2)" }}>{a.metric}: <span style={{ color: isCrit ? "#f85149" : "#d29922", fontWeight: "700" }}>{a.current}</span> / {a.threshold}</span>
                    <span style={{ fontSize: "11px", color: a.platform === "Google" ? "#4285F4" : "#1877F2", fontWeight: "600" }}>{a.platform}</span>
                    <span style={{ fontSize: "11px", color: "var(--t3)", marginLeft: "auto" }}>{a.ago}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Platform Split */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "16px" }}>Platform Split</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {platformBreakdown.length > 0 ? platformBreakdown.map((p: any) => {
                const pct   = totalSpend > 0 ? Math.round((Number(p.spend) / totalSpend) * 100) : 0;
                const color = p.platform === "GOOGLE" ? "#4285F4" : "#1877F2";
                const label = p.platform === "GOOGLE" ? "Google Ads" : "Meta Ads";
                return (
                  <div key={p.platform}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color }}>{label}</span>
                      <span style={{ fontSize: "13px", color: "var(--t2)" }}>${Number(p.spend).toLocaleString()} · {pct}%</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              }) : [
                { label: "Google Ads", pct: 62, color: "#4285F4", spend: "—" },
                { label: "Meta Ads",   pct: 38, color: "#1877F2", spend: "—" },
              ].map(p => (
                <div key={p.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: p.color }}>{p.label}</span>
                    <span style={{ fontSize: "13px", color: "var(--t2)" }}>{p.spend}</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)" }}>
                    <div style={{ height: "100%", width: `${p.pct}%`, background: p.color, borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Uploads */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)" }}>Recent Uploads</h2>
              <Link href="/uploads" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none", fontWeight: "500" }}>View all →</Link>
            </div>
            {uploads.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "10px" }}>No uploads yet</p>
                <Link href="/uploads/new" style={{ fontSize: "12px", fontWeight: "600", color: "#5865f2", textDecoration: "none", padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(88,101,242,0.3)", background: "rgba(88,101,242,0.08)" }}>Upload first dataset →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {uploads.map(u => {
                  const sc = statusCfg(u.status);
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "7px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px", color: "white", background: u.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                        {u.platform === "GOOGLE" ? "G" : "f"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.fileName}</div>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "5px", flexShrink: 0, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{u.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Campaigns Table */}
      {topCampaigns.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "18px" }}>Top Campaigns by Spend</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Campaign", "Platform", "Spend", "Clicks", "Conversions", "ROAS"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((c: any, i: number) => (
                  <tr key={i} style={{ borderBottom: i < topCampaigns.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <td style={{ padding: "12px", color: "var(--t1)", fontWeight: "500" }}>{c.campaign || "—"}</td>
                    <td style={{ padding: "12px", fontWeight: "600", color: c.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                      {c.platform === "GOOGLE" ? "Google" : "Meta"}
                    </td>
                    <td style={{ padding: "12px", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>${Number(c.spend).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "var(--t2)" }}>{Number(c.clicks).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "var(--t2)" }}>{Number(c.conversions).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", background: Number(c.roas) >= 3 ? "rgba(63,185,80,0.1)" : "rgba(245,158,11,0.1)", color: Number(c.roas) >= 3 ? "#3fb950" : "#d29922" }}>
                        {Number(c.roas).toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}