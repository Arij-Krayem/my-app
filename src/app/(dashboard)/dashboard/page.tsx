"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import EmptyState from "@/components/ui/EmptyState";
import { btnPrimary, btnSecondary, cardStyle, inputStyle } from "@/lib/styles";

interface BrandOption {
  id: string;
  name: string;
}

interface UploadSummary {
  fileName: string;
  id: string;
  platform: "GOOGLE" | "META";
  status: "FAILED" | "IMPORTED" | "MAPPED" | "PENDING";
}

interface PlatformBreakdownRow {
  platform: "GOOGLE" | "META";
  spend: number | string;
}

interface SpendRow {
  date: string;
  platform: "GOOGLE" | "META";
  spend: number | string;
}

interface TopCampaignRow {
  campaign?: string;
  clicks: number | string;
  conversions: number | string;
  platform: "GOOGLE" | "META";
  roas: number | string;
  spend: number | string;
}

interface AnalyticsResponse {
  kpis?: Record<string, number | string>;
  platformBreakdown?: PlatformBreakdownRow[];
  spendOverTime?: SpendRow[];
  topCampaigns?: TopCampaignRow[];
}

const MOCK_ALERTS = [
  { id: 1, campaign: "Summer Sale Campaign", metric: "ROAS", current: "2.1", threshold: "3.0", severity: "CRITICAL", ago: "2h ago", platform: "Google" },
  { id: 2, campaign: "Brand Awareness Q3", metric: "CTR", current: "1.2%", threshold: "2.0%", severity: "WARNING", ago: "4h ago", platform: "Meta" },
  { id: 3, campaign: "Product Launch", metric: "CPC", current: "$3.45", threshold: "$2.50", severity: "WARNING", ago: "6h ago", platform: "Google" },
] as const;

const KPI_META = [
  { label: "Total Spend", key: "totalSpend", prefix: "$", suffix: "", grad: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.2)" },
  { label: "Avg ROAS", key: "avgRoas", prefix: "", suffix: "x", grad: "linear-gradient(135deg,#5865f2,#818cf8)", glow: "rgba(88,101,242,0.2)" },
  { label: "Avg CTR", key: "avgCtr", prefix: "", suffix: "%", grad: "linear-gradient(135deg,#8b5cf6,#a78bfa)", glow: "rgba(139,92,246,0.2)" },
  { label: "Avg CPC", key: "avgCpc", prefix: "$", suffix: "", grad: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.2)" },
] as const;

const STATUS_CONFIG: Record<UploadSummary["status"], { bg: string; border: string; color: string }> = {
  IMPORTED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.25)" },
  MAPPED: { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
  PENDING: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  FAILED: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)" },
};

function userGreetingName(rawUser: string | null): string {
  if (!rawUser) return "Admin";

  try {
    const user = JSON.parse(rawUser) as { name?: string };
    return user.name?.trim() || "Admin";
  } catch {
    return "Admin";
  }
}

export default function DashboardPage(): React.ReactElement {
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [activeBrand, setActiveBrand] = useState("brand_visioad_001");
  const [platform, setPlatform] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isCompact, setIsCompact] = useState(false);
  const greetingName = typeof window === "undefined" ? "Admin" : userGreetingName(sessionStorage.getItem("user"));

  const fetchAnalytics = (brandId: string, nextPlatform: string, nextDateFrom: string, nextDateTo: string): void => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    setKpiLoading(true);
    const params = new URLSearchParams({ brandId });
    if (nextPlatform) params.set("platform", nextPlatform);
    if (nextDateFrom) params.set("dateFrom", nextDateFrom);
    if (nextDateTo) params.set("dateTo", nextDateTo);

    fetch(`/api/analytics/kpis?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: AnalyticsResponse | null) => {
        if (data?.kpis) setAnalytics(data);
      })
      .catch(() => setAnalytics(null))
      .finally(() => setKpiLoading(false));
  };

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    const syncViewport = (): void => {
      setIsCompact(window.innerWidth < 1040);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    const headers = { Authorization: `Bearer ${token}` };

    fetch("/api/brands", { headers, credentials: "include" })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: BrandOption[] }) => {
        const items = data.items ?? [];
        setBrands(items);
        const firstBrand = items[0]?.id ?? "brand_visioad_001";
        setActiveBrand(firstBrand);
        fetchAnalytics(firstBrand, "", "", "");
      })
      .catch(() => fetchAnalytics("brand_visioad_001", "", "", ""));

    fetch("/api/uploads?pageSize=4", { headers, credentials: "include" })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: UploadSummary[] }) => setUploads(Array.isArray(data.items) ? data.items : []))
      .catch(() => setUploads([]));

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const resetFilters = (): void => {
    setPlatform("");
    setDateFrom("");
    setDateTo("");
    fetchAnalytics(activeBrand, "", "", "");
  };

  const chartData = Object.values(
    (analytics?.spendOverTime ?? []).reduce<Record<string, { date: string; Google: number; Meta: number }>>((acc, row) => {
      const dateKey = String(row.date).split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, Google: 0, Meta: 0 };
      if (row.platform === "GOOGLE") acc[dateKey].Google = Number(row.spend);
      if (row.platform === "META") acc[dateKey].Meta = Number(row.spend);
      return acc;
    }, {}),
  );

  const topCampaigns = analytics?.topCampaigns ?? [];
  const platformBreakdown = analytics?.platformBreakdown ?? [];
  const totalSpend = platformBreakdown.reduce((sum, row) => sum + Number(row.spend), 0);
  const activeBrandName = brands.find((brand) => brand.id === activeBrand)?.name ?? "Visioad Main";
  const hasFilters = Boolean(platform || dateFrom || dateTo);

  const formatValue = (value: number, prefix = "", suffix = ""): string => {
    const formatted = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return `${prefix}${formatted}${suffix}`;
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div
        style={{
          ...cardStyle,
          marginBottom: "24px",
          padding: isCompact ? "22px" : "28px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,246,255,0.95) 100%)",
          boxShadow: "0 18px 40px rgba(148, 163, 184, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: isCompact ? "26px" : "30px", fontWeight: 700, color: "var(--t1)", marginBottom: "8px", letterSpacing: "-0.03em" }}>
              Good morning, {greetingName}
            </p>
            <p style={{ fontSize: "14px", color: "var(--t2)", maxWidth: "560px", lineHeight: 1.6 }}>
              Here&apos;s your campaign performance overview with quick filters, recent alerts, and the latest upload activity.
            </p>
          </div>

          <Link href="/uploads/new" style={{ ...btnPrimary, textDecoration: "none" }}>
            + New Upload
          </Link>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "9px 16px",
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.78)",
              fontSize: "13px",
              color: "var(--t2)",
              fontWeight: 500,
            }}
          >
            {brands.length > 1 ? `${brands.length} brands connected` : "Active workspace"}
          </span>
          <span
            style={{
              padding: "9px 16px",
              borderRadius: "999px",
              border: "1px solid rgba(88,101,242,0.25)",
              background: "rgba(88,101,242,0.08)",
              fontSize: "13px",
              color: "#5865f2",
              fontWeight: 700,
            }}
          >
            {activeBrandName}
          </span>
        </div>
      </div>

      {brands.length > 1 ? (
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => {
                setActiveBrand(brand.id);
                resetFilters();
                fetchAnalytics(brand.id, "", "", "");
              }}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                border: `1px solid ${activeBrand === brand.id ? "#5865f2" : "var(--border)"}`,
                background: activeBrand === brand.id ? "rgba(88,101,242,0.12)" : "transparent",
                color: activeBrand === brand.id ? "#5865f2" : "var(--t2)",
                fontSize: "13px",
                fontWeight: activeBrand === brand.id ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {brand.name}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ ...cardStyle, padding: isCompact ? "16px" : "18px 20px", marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
          {activeBrandName} - Filters
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isCompact ? "1fr" : "minmax(180px, 1.05fr) minmax(160px, 0.7fr) minmax(160px, 0.7fr) auto",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <select value={platform} onChange={(event) => setPlatform(event.target.value)} style={{ ...inputStyle, minWidth: 0 }}>
            <option value="">All Platforms</option>
            <option value="GOOGLE">Google Ads</option>
            <option value="META">Meta Ads</option>
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <div style={{ display: "flex", gap: "8px", justifyContent: isCompact ? "stretch" : "flex-end", flexWrap: "wrap" }}>
          {hasFilters ? (
            <button onClick={resetFilters} style={btnSecondary}>
              Reset
            </button>
          ) : null}
            <button onClick={() => fetchAnalytics(activeBrand, platform, dateFrom, dateTo)} style={btnPrimary}>
              {kpiLoading ? "Loading..." : "Apply"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "repeat(2,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))", gap: "16px", marginBottom: "24px" }}>
        {KPI_META.map((item) => {
          const rawValue = analytics?.kpis?.[item.key];
          const value = typeof rawValue === "number" || typeof rawValue === "string" ? formatValue(Number(rawValue), item.prefix, item.suffix) : "-";

          return (
            <div key={item.label} style={{ ...cardStyle, padding: "20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: item.glow, filter: "blur(20px)" }} />
              <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: item.grad, marginBottom: "14px" }} />
              <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--t1)", marginBottom: "3px", fontVariantNumeric: "tabular-nums" }}>
                {kpiLoading ? "Loading..." : value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--t2)" }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      {chartData.length > 0 ? (
        <div style={{ ...cardStyle, padding: "22px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--t1)" }}>Spend Over Time</h2>
            <span style={{ fontSize: "12px", color: "var(--t2)" }}>{chartData.length} days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gGoogle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1877F2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--t3)" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }}
                formatter={(value, name) => [`$${Number(value ?? 0).toLocaleString()}`, String(name)]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Area type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={2} fill="url(#gGoogle)" dot={false} />
              <Area type="monotone" dataKey="Meta" stroke="#1877F2" strokeWidth={2} fill="url(#gMeta)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1.2fr 0.8fr", gap: "16px", marginBottom: "24px" }}>
        <div style={{ ...cardStyle, padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--t1)" }}>Active Alerts</h2>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", background: "rgba(248,81,73,0.12)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
                {MOCK_ALERTS.filter((alert) => alert.severity === "CRITICAL").length} critical
              </span>
            </div>
            <Link href="/alerts" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none", fontWeight: 500 }}>
              View all
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {MOCK_ALERTS.map((alert) => {
              const critical = alert.severity === "CRITICAL";
              return (
                <div key={alert.id} style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--bg)", borderLeft: `3px solid ${critical ? "#f85149" : "#d29922"}`, border: `1px solid ${critical ? "rgba(248,81,73,0.15)" : "rgba(210,153,34,0.15)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)" }}>{alert.campaign}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: critical ? "rgba(248,81,73,0.12)" : "rgba(210,153,34,0.12)", color: critical ? "#f85149" : "#d29922", border: `1px solid ${critical ? "rgba(248,81,73,0.25)" : "rgba(210,153,34,0.25)"}` }}>
                      {alert.severity}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--t2)" }}>
                      {alert.metric}: <span style={{ color: critical ? "#f85149" : "#d29922", fontWeight: 700 }}>{alert.current}</span> / {alert.threshold}
                    </span>
                    <span style={{ fontSize: "11px", color: alert.platform === "Google" ? "#4285F4" : "#1877F2", fontWeight: 600 }}>{alert.platform}</span>
                    <span style={{ fontSize: "11px", color: "var(--t3)", marginLeft: "auto" }}>{alert.ago}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ ...cardStyle, padding: "20px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--t1)", marginBottom: "16px" }}>Platform Split</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(platformBreakdown.length > 0 ? platformBreakdown : [
                { platform: "GOOGLE", spend: 62 },
                { platform: "META", spend: 38 },
              ]).map((row) => {
                const percent = platformBreakdown.length > 0 ? Math.round((Number(row.spend) / totalSpend) * 100) : Number(row.spend);
                const color = row.platform === "GOOGLE" ? "#4285F4" : "#1877F2";
                const label = row.platform === "GOOGLE" ? "Google Ads" : "Meta Ads";

                return (
                  <div key={row.platform}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color }}>{label}</span>
                      <span style={{ fontSize: "13px", color: "var(--t2)" }}>{platformBreakdown.length > 0 ? `$${Number(row.spend).toLocaleString()} - ${percent}%` : `${percent}%`}</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)" }}>
                      <div style={{ height: "100%", width: `${percent}%`, background: color, borderRadius: "3px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "20px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--t1)" }}>Recent Uploads</h2>
              <Link href="/uploads" style={{ fontSize: "12px", color: "#5865f2", textDecoration: "none", fontWeight: 500 }}>
                View all
              </Link>
            </div>
            {uploads.length === 0 ? (
              <EmptyState title="No uploads yet" subtitle="Upload your first dataset to populate this panel." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {uploads.map((upload) => {
                  const status = STATUS_CONFIG[upload.status];

                  return (
                    <div key={upload.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", color: "#ffffff", background: upload.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                        {upload.platform === "GOOGLE" ? "G" : "f"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upload.fileName}</div>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                        {upload.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {topCampaigns.length > 0 ? (
        <div style={{ ...cardStyle, padding: "22px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--t1)", marginBottom: "18px" }}>Top Campaigns by Spend</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Campaign", "Platform", "Spend", "Clicks", "Conversions", "ROAS"].map((header) => (
                    <th key={header} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((campaign, index) => (
                  <tr key={`${campaign.campaign ?? "campaign"}-${index}`} style={{ borderBottom: index < topCampaigns.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "12px", color: "var(--t1)", fontWeight: 500 }}>{campaign.campaign || "-"}</td>
                    <td style={{ padding: "12px", fontWeight: 600, color: campaign.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                      {campaign.platform === "GOOGLE" ? "Google" : "Meta"}
                    </td>
                    <td style={{ padding: "12px", color: "var(--t1)" }}>${Number(campaign.spend).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "var(--t2)" }}>{Number(campaign.clicks).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "var(--t2)" }}>{Number(campaign.conversions).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: Number(campaign.roas) >= 3 ? "rgba(63,185,80,0.1)" : "rgba(245,158,11,0.1)", color: Number(campaign.roas) >= 3 ? "#3fb950" : "#d29922" }}>
                        {Number(campaign.roas).toFixed(2)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
