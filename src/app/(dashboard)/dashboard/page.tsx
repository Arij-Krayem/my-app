"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AlertRecord = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  rule?: { metricKey: string; severity: string } | null;
  brand?: { name: string } | null;
};

type BrandRecord = {
  id: string;
  name: string;
};

type AnalyticsResponse = {
  kpis?: {
    totalSpend?: number;
    avgRoas?: number;
    avgCtr?: number;
    avgCpc?: number;
  };
  spendOverTime?: Array<{
    date: string;
    spend: number;
    platform: string;
  }>;
};

const KPI_META = [
  {
    key: "totalSpend",
    label: "Total Spend",
    prefix: "$",
    suffix: "",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeColor: "#16a34a",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
  {
    key: "avgRoas",
    label: "Avg ROAS",
    prefix: "",
    suffix: "x",
    badgeBg: "rgba(99,102,241,0.12)",
    badgeColor: "#6366F1",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
  },
  {
    key: "avgCtr",
    label: "Avg CTR",
    prefix: "",
    suffix: "%",
    badgeBg: "rgba(20,184,166,0.12)",
    badgeColor: "#0f766e",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>,
  },
  {
    key: "avgCpc",
    label: "Avg CPC",
    prefix: "$",
    suffix: "",
    badgeBg: "rgba(245,158,11,0.14)",
    badgeColor: "#d97706",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
  },
] as const;

function formatValue(value: number | undefined, prefix = "", suffix = "") {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  const formatted =
    Math.abs(value) >= 1000
      ? `${(value / 1000).toFixed(1)}k`
      : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${prefix}${formatted}${suffix}`;
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function DashboardPage() {
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [activeBrand, setActiveBrand] = useState("");
  const [platform, setPlatform] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setAlerts] = useState<AlertRecord[]>([]);

  const fetchAnalytics = async (brandId: string, selectedPlatform: string, from: string, to: string) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (brandId) params.set("brandId", brandId);
    if (selectedPlatform) params.set("platform", selectedPlatform);
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);

    try {
      const data = await apiFetch<AnalyticsResponse>(`/api/analytics/kpis?${params.toString()}`);
      console.log("[dashboard] analytics response", data);
      setAnalytics(data);
    } catch (fetchError) {
      console.error("[dashboard] Failed to load analytics", fetchError);
      setAnalytics(null);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async (brandId: string) => {
    try {
      const data = await apiFetch<{ items?: AlertRecord[] }>(`/api/alerts?status=OPEN&brandId=${brandId}`);
      console.log("[dashboard] alerts response", data);
      setAlerts(data.items ?? []);
    } catch (fetchError) {
      console.error("[dashboard] Failed to load alerts", fetchError);
      setAlerts([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ items?: BrandRecord[] }>("/api/brands");
        const list: BrandRecord[] = data.items ?? [];
        console.log("[dashboard] brands response", data);
        setBrands(list);
        const firstBrand = list[0]?.id ?? "";
        setActiveBrand(firstBrand);
        if (firstBrand) {
          await Promise.all([fetchAnalytics(firstBrand, "", "", ""), fetchAlerts(firstBrand)]);
        } else {
          await fetchAnalytics("", "", "", "");
        }
      } catch (fetchError) {
        console.error("[dashboard] Failed to load brands", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load brands");
        setLoading(false);
      }
    })();
  }, []);

  const handleBrandChange = (brandId: string) => {
    setActiveBrand(brandId);
    setPlatform("");
    setDateFrom("");
    setDateTo("");
    fetchAnalytics(brandId, "", "", "");
    fetchAlerts(brandId);
  };

  const chartData = useMemo(() => {
    const spendOverTime = analytics?.spendOverTime ?? [];
    const grouped = spendOverTime.reduce<Record<string, { date: string; spend: number }>>(
      (accumulator, item) => {
        const dateKey = String(item.date).split("T")[0];
        if (!accumulator[dateKey]) {
          accumulator[dateKey] = { date: dateKey, spend: 0 };
        }
        accumulator[dateKey].spend += Number(item.spend);
        return accumulator;
      },
      {},
    );

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [analytics?.spendOverTime]);

  const activeBrandName =
    brands.find((brand) => brand.id === activeBrand)?.name ?? "No brand selected";

  const kpiValues = {
    totalSpend: analytics?.kpis?.totalSpend ?? 0,
    avgRoas: analytics?.kpis?.avgRoas ?? 0,
    avgCtr: analytics?.kpis?.avgCtr ?? 0,
    avgCpc: analytics?.kpis?.avgCpc ?? 0,
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#6366F1",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Dashboard
          </div>
          <h1 style={{ margin: 0, color: "#0f172a", fontSize: 30, fontWeight: 700 }}>
            Brand performance overview
          </h1>
        </div>

        <Link
          href="/uploads/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "11px 18px",
            borderRadius: 12,
            background: "linear-gradient(135deg,#5865f2,#7c83ff)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 12px 24px rgba(88,101,242,0.22)",
          }}
        >
          + New Upload
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 18,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {(brands.length > 0 ? brands : [{ id: activeBrand, name: "Visioad Main" }]).map((brand) => {
          const active = brand.id === activeBrand;
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => handleBrandChange(brand.id)}
              style={{
                border: "none",
                borderBottom: active ? "2px solid #111827" : "2px solid transparent",
                background: "transparent",
                padding: "4px 0 10px",
                color: active ? "#111827" : "#64748b",
                fontSize: 14,
                fontWeight: active ? 700 : 600,
                letterSpacing: active ? "0.02em" : "0.01em",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {brand.name.toUpperCase()}
            </button>
          );
        })}
      </div>

      <section
        style={{
          marginBottom: 20,
          padding: 18,
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,0.24)",
          background: "#fff",
          boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr 1fr auto",
            gap: 14,
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                marginBottom: 8,
                color: "#64748b",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Brand
            </div>
            <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>{activeBrandName}</div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#64748b",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Platform
            </label>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              style={{
                width: "100%",
                padding: "11px 13px",
                borderRadius: 10,
                border: "1px solid rgba(148,163,184,0.28)",
                background: "#f8fafc",
                color: "#0f172a",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            >
              <option value="">All Platforms</option>
              <option value="GOOGLE">Google Ads</option>
              <option value="META">Meta Ads</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                From
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 13px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.28)",
                  background: "#f8fafc",
                  color: "#64748b",
                }}
              >
                <CalendarIcon />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "#0f172a",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                To
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 13px",
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,0.28)",
                  background: "#f8fafc",
                  color: "#64748b",
                }}
              >
                <CalendarIcon />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "#0f172a",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(activeBrand, platform, dateFrom, dateTo)}
            style={{
              padding: "11px 18px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg,#5865f2,#7c83ff)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 12px 24px rgba(88,101,242,0.18)",
            }}
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 22,
        }}
      >
        {error ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.06)",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}
        {KPI_META.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.24)",
              background: "#fff",
              padding: 18,
              boxShadow: "0 10px 22px rgba(15,23,42,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: kpi.badgeBg,
                  color: kpi.badgeColor,
                }}
              >
                {kpi.icon}
              </span>
              <span style={{ color: "#64748b", fontSize: 13, fontWeight: 600 }}>{kpi.label}</span>
            </div>
            <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 700 }}>
              {loading
                ? "..."
                : formatValue(
                    kpiValues[kpi.key],
                    kpi.prefix,
                    kpi.suffix,
                  )}
            </div>
            <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 12 }}>
              Live summary for the selected filters
            </div>
          </div>
        ))}
      </section>

      <section
        style={{
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.24)",
          background: "#fff",
          padding: 22,
          boxShadow: "0 14px 30px rgba(15,23,42,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                marginBottom: 6,
                color: "#64748b",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Spend Over Time
            </div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22, fontWeight: 700 }}>
              Media spend trend
            </h2>
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            {chartData.length > 0 ? `${chartData.length} data points` : "Awaiting upload data"}
          </div>
        </div>

        <div style={{ height: 320, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.2)",
                  boxShadow: "0 12px 24px rgba(15,23,42,0.08)",
                }}
                formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Spend"]}
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#6366F1"
                strokeWidth={3}
                fill="url(#spendFill)"
                dot={false}
                activeDot={{ r: 5, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
