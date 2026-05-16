"use client";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import DashboardEnhanced from "@/components/dashboard/enhanced/DashboardEnhanced";
import GlobalStatusWidget from "@/components/dashboard/widgets/GlobalStatusWidget";
import PredictiveBaseline from "@/components/dashboard/widgets/PredictiveBaseline";
import styles from "./page.module.css";

type KpiKey = "totalSpend" | "avgRoas" | "avgCtr" | "avgCpc";

interface SpendRow {
  date: string;
  Google: number;
  Meta: number;
}

interface SpendApiRow {
  date: string;
  platform: string;
  spend: number | string;
}

interface PlatformBreakdown {
  platform: string;
  spend: number | string;
}

interface TopCampaign {
  campaign?: string | null;
  platform: string;
  spend: number | string;
  clicks: number | string;
  conversions: number | string;
  roas: number | string;
}

interface AnalyticsData {
  kpis?: Partial<Record<KpiKey, number | string>>;
  platformBreakdown?: PlatformBreakdown[];
  spendOverTime?: SpendApiRow[];
  topCampaigns?: TopCampaign[];
}

const KPI_META = [
  { label: "Total Spend", key: "totalSpend", prefix: "$", suffix: "", iconClass: styles.kpiIconTotalSpend, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: "Avg ROAS", key: "avgRoas", prefix: "", suffix: "x", iconClass: styles.kpiIconAvgRoas, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { label: "Avg CTR", key: "avgCtr", prefix: "", suffix: "%", iconClass: styles.kpiIconAvgCtr, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg> },
  { label: "Avg CPC", key: "avgCpc", prefix: "$", suffix: "", iconClass: styles.kpiIconAvgCpc, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg> },
] satisfies Array<{ label: string; key: KpiKey; prefix: string; suffix: string; iconClass: string; icon: ReactNode }>;

function SpendLegendPill({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className={styles.legendPill}>
      <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4 3" : undefined} /></svg>
      <span className={styles.legendLabel}>{label}</span>
    </div>
  );
}

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
// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const [analytics,   setAnalytics]   = useState<AnalyticsData | null>(null);
  const [kpiLoading,  setKpiLoading]  = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(sessionStorage.getItem("access_token"));
  });
  const [brands,      setBrands]      = useState<{ id: string; name: string }[]>([]);
  const [activeBrand, setActiveBrand] = useState("");
  const [platform,    setPlatform]    = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [,            setUserRole]    = useState<string>("");
  const [prevSpend,   setPrevSpend]   = useState<SpendRow[]>([]);

  const fetchPrevSpend = useCallback((brandId: string, plat: string, from: string, to: string) => {
    const token = sessionStorage.getItem("access_token"); if (!token || !brandId) return;
    const { prevFrom, prevTo } = getPrevBounds(from, to);
    const p = new URLSearchParams({ brandId, dateFrom: prevFrom, dateTo: prevTo });
    if (plat) p.set("platform", plat);
    fetch(`/api/analytics/kpis?${p}`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.spendOverTime) return;
        const rows = Object.values(
          (d.spendOverTime as SpendApiRow[]).reduce<Record<string, SpendRow>>((acc, row) => {
            const dt = String(row.date).split("T")[0];
            if (!acc[dt]) acc[dt] = { date: dt, Google: 0, Meta: 0 };
            if (row.platform === "GOOGLE") acc[dt].Google = Number(row.spend);
            if (row.platform === "META")   acc[dt].Meta   = Number(row.spend);
            return acc;
          }, {})
        );
        setPrevSpend(rows);
      }).catch(() => {});
  }, []);

  const fetchAnalytics = useCallback((brandId: string, plat: string, from: string, to: string) => {
    const token = sessionStorage.getItem("access_token"); if (!token || !brandId) return;
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
  }, [fetchPrevSpend]);

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
        const list = d.items ?? [];
        setBrands(list);
        if (!list.length) {
          setKpiLoading(false);
          return;
        }

        const first = list[0].id;
        setActiveBrand(first);
        fetchAnalytics(first, "", "", "");
      }).catch(() => { setKpiLoading(false); });
  }, [fetchAnalytics]);

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
  }, [fetchAnalytics]);

  const applyFilters = () => {
    if (!activeBrand) return;
    fetchAnalytics(activeBrand, platform, dateFrom, dateTo);
  };
  const resetFilters = () => {
    setPlatform(""); setDateFrom(""); setDateTo("");
    if (!activeBrand) return;
    fetchAnalytics(activeBrand, "", "", "");
  };

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
  const totalSpend        = platformBreakdown.reduce((s, p) => s + Number(p.spend), 0);
  const activeBrandName   = brands.find(b => b.id === activeBrand)?.name ?? "Visioad Main";

  const chartData = Object.values(
    spendOverTime.reduce<Record<string, SpendRow>>((acc, row) => {
      const d = String(row.date).split("T")[0];
      if (!acc[d]) acc[d] = { date: d, Google: 0, Meta: 0 };
      if (row.platform === "GOOGLE") acc[d].Google = Number(row.spend);
      if (row.platform === "META")   acc[d].Meta   = Number(row.spend);
      return acc;
    }, {})
  ) as SpendRow[];

  const mergedChartData = chartData.map((row, i) => ({
    ...row,
    prevTotal: prevSpend[i] != null ? (prevSpend[i].Google + prevSpend[i].Meta) : null,
  }));

  const hasFilters = platform || dateFrom || dateTo;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">DASHBOARD</div>
          <h1 className="dashboard-title">Brand performance overview</h1>
          <div className={styles.brandTitleWrap}>
            <button type="button" className={styles.brandTitleButton}>
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
        <div className={styles.brandPills}>
          {brands.map(b => (
            <button key={b.id} onClick={() => handleBrandSwitch(b.id)}
              className={`${styles.brandPill} ${activeBrand === b.id ? styles.brandPillActive : ""}`}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>{activeBrandName} · Filters</span>
        <select value={platform} onChange={e => setPlatform(e.target.value)} className={styles.filterInput}>
          <option value="">All Platforms</option>
          <option value="GOOGLE">Google Ads</option>
          <option value="META">Meta Ads</option>
        </select>
        <div className={styles.dateField}>
          <span className={styles.dateLabel}>From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.filterInput}
            max={new Date().toISOString().split("T")[0]} />
        </div>
        <div className={styles.dateField}>
          <span className={styles.dateLabel}>To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={styles.filterInput}
            max={new Date().toISOString().split("T")[0]} />
        </div>
        <div className={styles.filterActions}>
          {hasFilters && <button onClick={resetFilters} className={styles.resetButton}>Reset</button>}
          <button onClick={applyFilters} className={styles.applyButton}>
            {kpiLoading ? <><div className={styles.buttonSpinner} />Loading...</> : "Apply"}
          </button>
        </div>
        {hasFilters && (
          <div className={styles.filterChips}>
            {platform && <span className={styles.filterChip}>{platform === "GOOGLE" ? "Google Ads" : "Meta Ads"}</span>}
            {dateFrom && <span className={styles.filterChip}>From {dateFrom}</span>}
            {dateTo   && <span className={styles.filterChip}>To {dateTo}</span>}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {KPI_META.map(k => {
          const val = kpis ? fmt(Number(kpis[k.key]), k.prefix, k.suffix) : "—";
          return (
            <div key={k.label} className={`dashboard-card ${styles.kpiCard}`}>
              <div className={styles.kpiInner}>
                <div className={`${styles.kpiIcon} ${k.iconClass}`}>{k.icon}</div>
                <div className={styles.kpiBody}>
                  <div className={styles.kpiLabel}>{k.label}</div>
                  <div className={styles.kpiValue}>
                    {kpiLoading ? <span className={styles.kpiLoadingText}>Loading...</span> : val}
                  </div>
                  <div className={styles.kpiNote}>Live summary for the selected filters</div>
                </div>
                {kpiLoading && <div className={styles.smallSpinner} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Status Widget — self-gates to admin via 403 */}
      <GlobalStatusWidget />
      {activeBrand && (
        <PredictiveBaseline brandId={activeBrand} platform={platform} dateFrom={dateFrom} dateTo={dateTo} />
      )}

      {/* Spend Over Time */}
      {mergedChartData.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className="dashboard-section-label">SPEND OVER TIME</div>
              <h2 className={styles.panelTitle}>Media spend trend</h2>
            </div>
            <span className={styles.daysLabel}>{mergedChartData.length} days</span>
          </div>
          <div className={styles.legendRow}>
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
                formatter={(val: unknown, name: unknown) => [`$${Number(val).toLocaleString()}`, String(name)]}
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
      <div className={styles.panel}>
        <h2 className={styles.platformTitle}>Platform Split</h2>
        <div className={styles.platformList}>
          {platformBreakdown.length > 0 ? platformBreakdown.map((p) => {
            const pct   = totalSpend > 0 ? Math.round((Number(p.spend) / totalSpend) * 100) : 0;
            const platformClass = p.platform === "GOOGLE" ? styles.platformGoogle : styles.platformMeta;
            const label = p.platform === "GOOGLE" ? "Google Ads" : "Meta Ads";
            return (
              <div key={p.platform}>
                <div className={styles.platformRow}>
                  <span className={`${styles.platformName} ${platformClass}`}>{label}</span>
                  <span className={styles.platformValue}>${Number(p.spend).toLocaleString()} · {pct}%</span>
                </div>
                <progress className={`${styles.progressBar} ${platformClass}`} value={pct} max={100} />
              </div>
            );
          }) : <p className={styles.emptyPlatformText}>No platform data yet</p>}
        </div>
      </div>

      {/* Top Campaigns */}
      {topCampaigns.length > 0 && (
        <div className={`${styles.panel} ${styles.campaignPanel}`}>
          <h2 className={styles.campaignTitle}>Top Campaigns by Spend</h2>
          <div className={styles.tableScroll}>
            <table className={styles.campaignTable}>
              <thead><tr>{["Campaign","Platform","Spend","Clicks","Conversions","ROAS"].map(h => <th key={h} className={styles.campaignHeadCell}>{h}</th>)}</tr></thead>
              <tbody>
                {topCampaigns.map((c, i) => (
                  <tr key={i} className={styles.campaignRow}>
                    <td className={styles.campaignCellStrong}>{c.campaign || "—"}</td>
                    <td className={`${styles.campaignCellPlatform} ${c.platform === "GOOGLE" ? styles.platformGoogle : styles.platformMeta}`}>{c.platform === "GOOGLE" ? "Google" : "Meta"}</td>
                    <td className={styles.campaignCellMetric}>${Number(c.spend).toLocaleString()}</td>
                    <td className={styles.campaignCellMuted}>{Number(c.clicks).toLocaleString()}</td>
                    <td className={styles.campaignCellMuted}>{Number(c.conversions).toLocaleString()}</td>
                    <td className={styles.campaignCell}><span className={`${styles.roasBadge} ${Number(c.roas) >= 3 ? styles.roasGood : styles.roasWarning}`}>{Number(c.roas).toFixed(2)}x</span></td>
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
