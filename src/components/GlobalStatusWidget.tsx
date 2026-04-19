"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandRow {
  brand: string;
  open: number;
  resolved: number;
  unresolved: number;
  critical: number;
  warning: number;
  total: number;
}

interface GlobalStatus {
  totals: { resolved: number; open: number; unresolved: number; total: number };
  byBrand: BrandRow[];
  meta: { brands: number; users: number; uploads: number };
}

type TimeFilter = "week" | "month" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  resolved:   "#1D9E75",
  open:       "#1A3A8C",
  unresolved: "#5DCAA5",
};

function healthLabel(resPct: number, critR: number): { label: string; color: string; bg: string } {
  if (resPct >= 85 && critR < 15) return { label: "Healthy",  color: "#085041", bg: "rgba(29,158,117,0.12)"  };
  if (resPct >= 50)                return { label: "Warning",  color: "#633806", bg: "rgba(239,159,39,0.12)"  };
  return                                  { label: "Critical", color: "#791F1F", bg: "rgba(226,75,74,0.12)"   };
}

// ─── Custom outer label with leader lines ─────────────────────────────────────

function renderCustomLabel({ cx, cy, midAngle, outerRadius, value }: any) {
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const r1x = cx + (outerRadius + 8)  * Math.cos(-midAngle * RADIAN);
  const r1y = cy + (outerRadius + 8)  * Math.sin(-midAngle * RADIAN);
  const r2x = cx + (outerRadius + 28) * Math.cos(-midAngle * RADIAN);
  const r2y = cy + (outerRadius + 28) * Math.sin(-midAngle * RADIAN);
  const anchor = r2x > cx ? "start" : "end";
  return (
    <g>
      <line x1={r1x} y1={r1y} x2={r2x} y2={r2y} stroke="var(--t3)" strokeWidth={0.8} />
      <text
        x={r2x + (r2x > cx ? 4 : -4)}
        y={r2y}
        textAnchor={anchor}
        dominantBaseline="central"
        style={{ fontSize: 12, fontWeight: 700, fill: "var(--t1)", fontFamily: "inherit" }}
      >
        {value.toLocaleString()}
      </text>
    </g>
  );
}

// ─── Donut tooltip ────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 14px", fontSize: 13 }}>
      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: p.fill, marginRight: 7 }} />
      <strong style={{ color: "var(--t1)" }}>{name}</strong>
      <span style={{ color: "var(--t2)", marginLeft: 10 }}>{value.toLocaleString()}</span>
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export default function GlobalStatusWidget() {
  const [data,       setData]      = useState<GlobalStatus | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [forbidden,  setForbidden] = useState(false);
  const [timeFilter, setTimeFilter]= useState<TimeFilter>("week");
  const [activeIdx,  setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const tok = sessionStorage.getItem("access_token");
    if (!tok) { setLoading(false); return; }
    fetch("/api/analytics/global-status", {
      headers: { Authorization: `Bearer ${tok}` },
      credentials: "include",
    })
      .then(r => {
        if (r.status === 403) { setForbidden(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, marginBottom: 24, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#1D9E75", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
  if (forbidden || !data || data.totals.total === 0) return null;

  const { totals, byBrand, meta } = data;
  const resRate   = totals.total > 0 ? Math.round((totals.resolved / totals.total) * 100) : 0;
  const critCount = byBrand.reduce((s, b) => s + (b.critical ?? 0), 0);

  const donutData = [
    { name: "Resolved",   value: totals.resolved,  fill: STATUS_COLORS.resolved   },
    { name: "Open",       value: totals.open,       fill: STATUS_COLORS.open       },
    { name: "Unresolved", value: totals.unresolved, fill: STATUS_COLORS.unresolved },
  ].filter(d => d.value > 0);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "4px 13px", fontSize: 12, fontWeight: active ? 700 : 500,
    fontFamily: "inherit", border: "none", cursor: "pointer",
    background: active ? "#1D9E75" : "transparent",
    color: active ? "white" : "var(--t2)",
    borderRadius: 6, transition: "all 0.15s",
  });

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 26px", marginBottom: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--t1)", margin: 0 }}>Overall status</h2>
          <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 3 }}>
            Admin · {meta.brands} brands · status × severity × brand × time
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 2 }}>
            {(["week","month","all"] as TimeFilter[]).map(t => (
              <button key={t} onClick={() => setTimeFilter(t)} style={tabBtn(timeFilter === t)}>
                {t === "week" ? "7 days" : t === "month" ? "30 days" : "All time"}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "rgba(29,158,117,0.1)", color: "#085041", border: "1px solid rgba(29,158,117,0.3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Admin
          </span>
        </div>
      </div>

      {/* ── Single body: donut + right panel ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "center" }}>

        {/* LEFT — donut chart only */}
        <div>
          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 6 }}>
            {donutData.map((d, i) => (
              <button
                key={d.name}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, opacity: activeIdx !== null && activeIdx !== i ? 0.35 : 1, transition: "opacity 0.2s" }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", fontFamily: "inherit" }}>{d.name}</span>
              </button>
            ))}
          </div>

          {/* Chart + center label */}
          <div style={{ position: "relative" }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={96}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  onMouseEnter={(_, i) => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={entry.fill}
                      opacity={activeIdx !== null && activeIdx !== i ? 0.25 : 1}
                      stroke="var(--card)"
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center text */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--t1)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {activeIdx !== null ? donutData[activeIdx]?.value.toLocaleString() : totals.total.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 5, fontWeight: 500 }}>
                {activeIdx !== null ? donutData[activeIdx]?.name : "total alerts"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — summary stats + brand list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* 4 stat tiles in 2×2 grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Resolution rate", value: `${resRate}%`,             color: "#1D9E75" },
              { label: "Critical alerts", value: critCount.toLocaleString(), color: "#E24B4A" },
              { label: "Brands",          value: String(meta.brands),        color: "var(--t1)" },
              { label: "Uploads",         value: String(meta.uploads),       color: "var(--t1)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Brand breakdown — stacked progress bars */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
              Brand breakdown
            </div>
            {byBrand.map((b, i) => {
              const total  = Math.max(b.total, 1);
              const resPct = Math.round((b.resolved / total) * 100);
              const critR  = Math.round(((b.critical ?? 0) / Math.max((b.critical ?? 0) + (b.warning ?? 0), 1)) * 100);
              const h      = healthLabel(resPct, critR);
              const rPct   = Math.round((b.resolved   / total) * 100);
              const oPct   = Math.round((b.open       / total) * 100);
              const uPct   = Math.max(0, 100 - rPct - oPct);
              return (
                <div key={b.brand} style={{ marginBottom: i < byBrand.length - 1 ? 12 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                      {b.brand}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: h.bg, color: h.color, flexShrink: 0, marginLeft: 8 }}>
                      {h.label}
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ display: "flex", height: "100%" }}>
                      <div style={{ width: `${rPct}%`, background: STATUS_COLORS.resolved,   transition: "width 0.6s ease" }} />
                      <div style={{ width: `${oPct}%`, background: STATUS_COLORS.open,        transition: "width 0.6s ease" }} />
                      <div style={{ width: `${uPct}%`, background: STATUS_COLORS.unresolved,  transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}