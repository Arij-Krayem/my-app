"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import DashboardEnhanced from "@/components/DashboardEnhanced";

const KPI_META = [
  { label: "Total Spend", key: "totalSpend", prefix: "$", suffix: "", iconBg: "#e7f8ef", iconColor: "#16a34a", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: "Avg ROAS", key: "avgRoas", prefix: "", suffix: "x", iconBg: "#eef2ff", iconColor: "#5865f2", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label: "Avg CTR", key: "avgCtr", prefix: "", suffix: "%", iconBg: "#ecfeff", iconColor: "#0f766e", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg> },
  { label: "Avg CPC", key: "avgCpc", prefix: "$", suffix: "", iconBg: "#fff7e6", iconColor: "#b7791f", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg> },
];

const inputSt: React.CSSProperties = {
  padding: "8px 12px", background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "9px", color: "var(--t1)", fontSize: "13px", fontFamily: "inherit", outline: "none",
};

function SpendLegendPill({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4 3" : undefined} /></svg>
      <span style={{ fontSize: "11px", color: "var(--t2)", fontWeight: "500" }}>{label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATUS WIDGET
// ══════════════════════════════════════════════════════════════════════════════

interface BrandRow {
  brand: string;
  open: number; resolved: number; unresolved: number;
  critical: number; warning: number; total: number;
}
interface GlobalStatus {
  totals:  { resolved: number; open: number; unresolved: number; total: number };
  byBrand: BrandRow[];
  meta:    { brands: number; users: number; uploads: number };
}

const STATUS_COLORS = { resolved: "#3fb950", open: "#1D4A8C", unresolved: "#06b6d4" };
const SEV_COLORS    = { critical: "#f85149", warning: "#d29922" };

function ActiveDonutShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 7} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 13} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--t1)" fontSize={16} fontWeight={700}>{Number(value).toLocaleString()}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--t2)" fontSize={12}>{payload.name}</text>
    </g>
  );
}

function GlobalStatusWidget() {
  const [data,        setData]        = useState<GlobalStatus | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [forbidden,   setForbidden]   = useState(false);
  const [activeSlice, setActiveSlice] = useState<number | null>(0);
  const [barDim,      setBarDim]      = useState<"status" | "severity">("status");

  useEffect(() => {
    const tok = sessionStorage.getItem("access_token");
    if (!tok) { setLoading(false); return; }
    fetch("/api/analytics/global-status", {
      headers: { Authorization: `Bearer ${tok}` }, credentials: "include",
    })
      .then(r => { if (r.status === 403) { setForbidden(true); return null; } return r.ok ? r.json() : null; })
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "24px", display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
  if (forbidden) return null;
  if (!data || data.totals.total === 0) return null;

  const { totals, byBrand, meta } = data;
  const donutData = [
    { name: "Resolved",   value: totals.resolved,   color: STATUS_COLORS.resolved   },
    { name: "Open",       value: totals.open,        color: STATUS_COLORS.open       },
    { name: "Unresolved", value: totals.unresolved,  color: STATUS_COLORS.unresolved },
  ].filter(d => d.value > 0);

  const barTooltip = {
    contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" },
  };

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", margin: 0 }}>Overall Status</h2>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "3px" }}>3-dimensional view — status × severity × brand · all {meta.brands} brands</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", borderRadius: "8px", border: "1px solid var(--border)", overflow: "hidden" }}>
            {(["status", "severity"] as const).map(d => (
              <button key={d} onClick={() => setBarDim(d)}
                style={{ padding: "5px 12px", fontSize: "11px", fontWeight: "600", fontFamily: "inherit", border: "none", cursor: "pointer", background: barDim === d ? "#5865f2" : "transparent", color: barDim === d ? "white" : "var(--t2)", transition: "all 0.15s" }}>
                By {d}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.25)", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Admin</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "6px" }}>Dim 1 — Status</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "4px", flexWrap: "wrap" }}>
            {donutData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color }} />
                <span style={{ fontSize: "11px", color: "var(--t2)", fontWeight: "500" }}>{d.name}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={58} outerRadius={90} paddingAngle={3}
                  shape={(props: any) => props.index === activeSlice ? <ActiveDonutShape {...props} /> : <Sector {...props} />}
                  onMouseEnter={(_, i) => setActiveSlice(i)} onMouseLeave={() => setActiveSlice(null)}>
                  {donutData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }}
                  formatter={(v: any, name: any) => [Number(v).toLocaleString(), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "700", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Total</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--t1)", lineHeight: 1.1 }}>{totals.total.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginTop: "8px" }}>
            {[{ label: "Brands", value: meta.brands }, { label: "Users", value: meta.users }, { label: "Uploads", value: meta.uploads }].map(m => (
              <div key={m.label} style={{ textAlign: "center", padding: "7px 4px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>{m.value}</div>
                <div style={{ fontSize: "10px", color: "var(--t3)", fontWeight: "600", textTransform: "uppercase" as const, letterSpacing: "0.3px" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "10px" }}>
            {barDim === "status" ? "Dim 2 × Dim 3 — Status per brand" : "Dim 2 × Dim 3 — Severity per brand"}
          </p>
          {byBrand.length > 0 ? (
            <ResponsiveContainer width="100%" height={barDim === "status" ? 220 : 180}>
              <BarChart data={byBrand} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="brand" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v} />
                <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...barTooltip} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                {barDim === "status" ? (
                  <>
                    <Bar dataKey="resolved"   name="Resolved"   stackId="s" fill={STATUS_COLORS.resolved}   radius={[0,0,0,0]} />
                    <Bar dataKey="open"       name="Open"       stackId="s" fill={STATUS_COLORS.open}       radius={[0,0,0,0]} />
                    <Bar dataKey="unresolved" name="Unresolved" stackId="s" fill={STATUS_COLORS.unresolved} radius={[3,3,0,0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="critical" name="Critical" fill={SEV_COLORS.critical} radius={[3,3,0,0]} />
                    <Bar dataKey="warning"  name="Warning"  fill={SEV_COLORS.warning}  radius={[3,3,0,0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px" }}>
              <p style={{ fontSize: "13px", color: "var(--t3)" }}>No brand data yet</p>
            </div>
          )}
          <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              { dim: "Dim 1", label: "Status",   desc: "Resolved / Open / Unresolved", color: "#3fb950" },
              { dim: "Dim 2", label: "Severity", desc: "Critical / Warning",            color: "#f85149" },
              { dim: "Dim 3", label: "Brand",    desc: "Each bar = 1 brand",            color: "#5865f2" },
            ].map(d => (
              <div key={d.dim} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: d.color, textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>{d.dim}</div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--t1)", marginTop: "2px" }}>{d.label}</div>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "1px" }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const [analytics,   setAnalytics]   = useState<any>(null);
  const [kpiLoading,  setKpiLoading]  = useState(true);
  const [brands,      setBrands]      = useState<{ id: string; name: string }[]>([]);
  const [activeBrand, setActiveBrand] = useState("brand_visioad_001");
  const [platform,    setPlatform]    = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [userRole,    setUserRole]    = useState<string>("");
  const [prevSpend,   setPrevSpend]   = useState<{ date: string; Google: number; Meta: number }[]>([]);

  function getPrevBounds(from: string, to: string) {
    if (from && to) {
      const f = new Date(from), t = new Date(to);
      const days = Math.ceil((t.getTime() - f.getTime()) / 86400000) + 1;
      const pf = new Date(f); pf.setDate(pf.getDate() - days);
      const pt = new Date(f); pt.setDate(pt.getDate() - 1);
      return { prevFrom: pf.toISOString().split("T")[0], prevTo: pt.toISOString().split("T")[0] };
    }
    const today = new Date();
    const pf = new Date(today); pf.setDate(pf.getDate() - 60);
    const pt = new Date(today); pt.setDate(pt.getDate() - 31);
    return { prevFrom: pf.toISOString().split("T")[0], prevTo: pt.toISOString().split("T")[0] };
  }

  const fetchPrevSpend = (brandId: string, plat: string, from: string, to: string) => {
    const token = sessionStorage.getItem("access_token"); if (!token) return;
    const { prevFrom, prevTo } = getPrevBounds(from, to);
    const p = new URLSearchParams({ brandId, dateFrom: prevFrom, dateTo: prevTo });
    if (plat) p.set("platform", plat);
    fetch(`/api/analytics/kpis?${p}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.spendOverTime) return;
        const rows: { date: string; Google: number; Meta: number }[] = Object.values(
          d.spendOverTime.reduce((acc: any, row: any) => {
            const dt = String(row.date).split("T")[0];
            if (!acc[dt]) acc[dt] = { date: dt, Google: 0, Meta: 0 };
            if (row.platform === "GOOGLE") acc[dt].Google = Number(row.spend);
            if (row.platform === "META")   acc[dt].Meta   = Number(row.spend);
            return acc;
          }, {})
        );
        setPrevSpend(rows);
      }).catch(() => {});
  };

  const fetchAnalytics = (brandId: string, plat: string, from: string, to: string) => {
    const token = sessionStorage.getItem("access_token"); if (!token) return;
    setKpiLoading(true);
    const p = new URLSearchParams({ brandId });
    if (plat) p.set("platform", plat);
    if (from) p.set("dateFrom", from);
    if (to)   p.set("dateTo", to);
    fetch(`/api/analytics/kpis?${p}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.kpis) setAnalytics(d); })
      .catch(() => {}).finally(() => setKpiLoading(false));
    fetchPrevSpend(brandId, plat, from, to);
  };

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem("access_token") ?? "";
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch("/api/users/me", { headers, credentials: "include" })
      .then(r => r.ok ? r.json() : null).then(d => { if (d?.role) setUserRole(d.role); }).catch(() => {});
    fetch("/api/brands", { headers, credentials: "include" })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => {
        const list = d.items ?? []; setBrands(list);
        const first = list.length > 0 ? list[0].id : "brand_visioad_001";
        setActiveBrand(first); fetchAnalytics(first, "", "", "");
      }).catch(() => { fetchAnalytics("brand_visioad_001", "", "", ""); });
  }, []);

  // ── Listen for brand-change events fired by layout.tsx top-bar dropdown ───
  useEffect(() => {
    const handler = (e: Event) => {
      const brandId = (e as CustomEvent<{ brandId: string }>).detail?.brandId;
      if (!brandId) return;
      setActiveBrand(brandId);
      setPlatform(""); setDateFrom(""); setDateTo("");
      fetchAnalytics(brandId, "", "", "");
    };
    window.addEventListener("brand-change", handler);
    return () => window.removeEventListener("brand-change", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => fetchAnalytics(activeBrand, platform, dateFrom, dateTo);
  const resetFilters = () => { setPlatform(""); setDateFrom(""); setDateTo(""); fetchAnalytics(activeBrand, "", "", ""); };

  const handleBrandSwitch = (brandId: string) => {
    setActiveBrand(brandId); setPlatform(""); setDateFrom(""); setDateTo("");
    fetchAnalytics(brandId, "", "", "");
    window.dispatchEvent(new CustomEvent("brand-change-sync", { detail: { brandId } }));
  };

  const fmt = (val: number, prefix = "", suffix = "") => {
    if (val === undefined || val === null) return "—";
    const formatted = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return `${prefix}${formatted}${suffix}`;
  };

  const kpis              = analytics?.kpis;
  const platformBreakdown = analytics?.platformBreakdown ?? [];
  const spendOverTime     = analytics?.spendOverTime     ?? [];
  const topCampaigns      = analytics?.topCampaigns      ?? [];
  const totalSpend        = platformBreakdown.reduce((s: number, p: any) => s + Number(p.spend), 0);
  const activeBrandName   = brands.find(b => b.id === activeBrand)?.name ?? "Visioad Main";

  const chartData = Object.values(
    spendOverTime.reduce((acc: any, row: any) => {
      const d = String(row.date).split("T")[0];
      if (!acc[d]) acc[d] = { date: d, Google: 0, Meta: 0 };
      if (row.platform === "GOOGLE") acc[d].Google = Number(row.spend);
      if (row.platform === "META")   acc[d].Meta   = Number(row.spend);
      return acc;
    }, {})
  ) as { date: string; Google: number; Meta: number }[];

  const mergedChartData = chartData.map((row, i) => ({
    ...row,
    prevTotal: prevSpend[i] != null ? (prevSpend[i].Google + prevSpend[i].Meta) : null,
  }));

  const hasFilters = platform || dateFrom || dateTo;

  return (
    <div className="dashboard-page">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">DASHBOARD</div>
          <h1 className="dashboard-title">Brand performance overview</h1>
          <div style={{ marginTop: "20px" }}>
            <button type="button" style={{ border: "none", background: "transparent", padding: 0, borderBottom: "2px solid var(--t1)", color: "var(--t1)", fontSize: "18px", fontWeight: "800", cursor: "default" }}>
              {activeBrandName.toUpperCase()}
            </button>
          </div>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <Link href="/uploads/new" className="btn-primary">+ New Upload</Link>
        </div>
      </div>

      {/* Brand pill switcher */}
      {brands.length > 1 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {brands.map(b => (
            <button key={b.id} onClick={() => handleBrandSwitch(b.id)}
              style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${activeBrand === b.id ? "#5865f2" : "var(--border)"}`, background: activeBrand === b.id ? "rgba(88,101,242,0.12)" : "transparent", color: activeBrand === b.id ? "#5865f2" : "var(--t2)", fontSize: "13px", fontWeight: activeBrand === b.id ? "700" : "500", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "14px", padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{activeBrandName} · Filters</span>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={inputSt}>
          <option value="">All Platforms</option>
          <option value="GOOGLE">Google Ads</option>
          <option value="META">Meta Ads</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--t3)" }}>From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputSt}
            max={new Date().toISOString().split("T")[0]} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--t3)" }}>To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputSt}
            max={new Date().toISOString().split("T")[0]} />
        </div>
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          {hasFilters && <button onClick={resetFilters} style={{ padding: "8px 14px", borderRadius: "9px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Reset</button>}
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
            <div key={k.label} className="dashboard-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: k.iconBg, color: k.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{k.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", color: "var(--t2)", fontWeight: "700", marginBottom: "12px" }}>{k.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--t1)", marginBottom: "6px", fontVariantNumeric: "tabular-nums" }}>
                    {kpiLoading ? <span style={{ fontSize: "16px", color: "var(--t3)" }}>Loading...</span> : val}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--t3)" }}>Live summary for the selected filters</div>
                </div>
                {kpiLoading && <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Status Widget — self-gates to admin via 403 */}
      <GlobalStatusWidget />

      {/* Spend Over Time */}
      {mergedChartData.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <div className="dashboard-section-label">SPEND OVER TIME</div>
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--t1)", marginTop: "6px" }}>Media spend trend</h2>
            </div>
            <span style={{ fontSize: "12px", color: "var(--t2)" }}>{mergedChartData.length} days</span>
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
            <SpendLegendPill color="#4285F4" label="Google" />
            <SpendLegendPill color="#1877F2" label="Meta" />
            <SpendLegendPill color="#888780" label="Prev. period" dashed />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mergedChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              <Bar dataKey="Google" name="Google" stackId="curr" fill="#4285F4" radius={[0,0,0,0]} />
              <Bar dataKey="Meta"   name="Meta"   stackId="curr" fill="#1877F2" radius={[3,3,0,0]} />
              <Line type="monotone" dataKey="prevTotal" name="Prev. period" stroke="#888780" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls opacity={0.65} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Platform Split — full width */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "16px" }}>Platform Split</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {platformBreakdown.length > 0 ? platformBreakdown.map((p: any) => {
            const pct   = totalSpend > 0 ? Math.round((Number(p.spend) / totalSpend) * 100) : 0;
            const color = p.platform === "GOOGLE" ? "#4285F4" : "#1877F2";
            const label = p.platform === "GOOGLE" ? "Google Ads" : "Meta Ads";
            return (
              <div key={p.platform}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color }}>{label}</span>
                  <span style={{ fontSize: "14px", color: "var(--t2)" }}>${Number(p.spend).toLocaleString()} · {pct}%</span>
                </div>
                <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          }) : <p style={{ fontSize: "13px", color: "var(--t3)", textAlign: "center", padding: "12px 0" }}>No platform data yet</p>}
        </div>
      </div>

      {/* Top Campaigns */}
      {topCampaigns.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "0" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "18px" }}>Top Campaigns by Spend</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead><tr>{["Campaign","Platform","Spend","Clicks","Conversions","ROAS"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {topCampaigns.map((c: any, i: number) => (
                  <tr key={i} style={{ borderBottom: i < topCampaigns.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <td style={{ padding: "12px", color: "var(--t1)", fontWeight: "500" }}>{c.campaign || "—"}</td>
                    <td style={{ padding: "12px", fontWeight: "600", color: c.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>{c.platform === "GOOGLE" ? "Google" : "Meta"}</td>
                    <td style={{ padding: "12px", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>${Number(c.spend).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "var(--t2)" }}>{Number(c.clicks).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "var(--t2)" }}>{Number(c.conversions).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", background: Number(c.roas) >= 3 ? "rgba(63,185,80,0.1)" : "rgba(245,158,11,0.1)", color: Number(c.roas) >= 3 ? "#3fb950" : "#d29922" }}>{Number(c.roas).toFixed(2)}x</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DashboardEnhanced brandId={activeBrand} platform={platform} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}