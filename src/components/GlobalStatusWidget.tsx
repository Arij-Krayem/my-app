"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./GlobalStatusWidget.module.css";

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
type HealthTone = "healthy" | "warning" | "critical";
interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  value: number;
}
interface TooltipPayload {
  name: string;
  value: number;
  payload: { fill: string };
}

const STATUS_COLORS = {
  resolved: "#1D9E75",
  open: "#1A3A8C",
  unresolved: "#5DCAA5",
};

function healthLabel(resPct: number, critR: number): { label: string; tone: HealthTone } {
  if (resPct >= 85 && critR < 15) return { label: "Healthy", tone: "healthy" };
  if (resPct >= 50) return { label: "Warning", tone: "warning" };
  return { label: "Critical", tone: "critical" };
}

function healthClass(tone: HealthTone) {
  if (tone === "healthy") return styles.healthHealthy;
  if (tone === "warning") return styles.healthWarning;
  return styles.healthCritical;
}

function renderCustomLabel(props: unknown) {
  const { cx, cy, midAngle, outerRadius, value } = props as CustomLabelProps;
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const r1x = cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN);
  const r1y = cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN);
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
        fontSize={12}
        fontWeight={700}
        fill="var(--t1)"
        fontFamily="inherit"
      >
        {value.toLocaleString()}
      </text>
    </g>
  );
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className={styles.tooltip}>
      <svg className={styles.tooltipDot} viewBox="0 0 8 8" aria-hidden="true">
        <circle cx="4" cy="4" r="4" fill={p.fill} />
      </svg>
      <strong className={styles.tooltipName}>{name}</strong>
      <span className={styles.tooltipValue}>{value.toLocaleString()}</span>
    </div>
  );
}

export default function GlobalStatusWidget() {
  const [data, setData] = useState<GlobalStatus | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(sessionStorage.getItem("access_token"));
  });
  const [forbidden, setForbidden] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const tok = sessionStorage.getItem("access_token");
    if (!tok) return;
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
    <div className={`${styles.card} ${styles.loadingCard}`}>
      <div className={styles.spinner} />
    </div>
  );
  if (forbidden || !data || data.totals.total === 0) return null;

  const { totals, byBrand, meta } = data;
  const resRate = totals.total > 0 ? Math.round((totals.resolved / totals.total) * 100) : 0;
  const critCount = byBrand.reduce((s, b) => s + (b.critical ?? 0), 0);

  const donutData = [
    { name: "Resolved", value: totals.resolved, fill: STATUS_COLORS.resolved },
    { name: "Open", value: totals.open, fill: STATUS_COLORS.open },
    { name: "Unresolved", value: totals.unresolved, fill: STATUS_COLORS.unresolved },
  ].filter(d => d.value > 0);

  return (
    <div className={`${styles.card} ${styles.statusCard}`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Overall status</h2>
          <p className={styles.subtitle}>
            Admin &middot; {meta.brands} brands &middot; status x severity x brand x time
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.tabs}>
            {(["week", "month", "all"] as TimeFilter[]).map(t => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`${styles.tabButton} ${timeFilter === t ? styles.tabButtonActive : ""}`}
              >
                {t === "week" ? "7 days" : t === "month" ? "30 days" : "All time"}
              </button>
            ))}
          </div>
          <span className={styles.adminBadge}>Admin</span>
        </div>
      </div>

      <div className={styles.bodyGrid}>
        <div>
          <div className={styles.legend}>
            {donutData.map((d, i) => (
              <button
                key={d.name}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`${styles.legendButton} ${activeIdx !== null && activeIdx !== i ? styles.legendButtonMuted : ""}`}
              >
                <svg className={styles.legendDot} viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="5" fill={d.fill} />
                </svg>
                <span className={styles.legendText}>{d.name}</span>
              </button>
            ))}
          </div>

          <div className={styles.chartWrap}>
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

            <div className={styles.centerLabel}>
              <div className={styles.centerValue}>
                {activeIdx !== null ? donutData[activeIdx]?.value.toLocaleString() : totals.total.toLocaleString()}
              </div>
              <div className={styles.centerText}>
                {activeIdx !== null ? donutData[activeIdx]?.name : "total alerts"}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.statGrid}>
            {[
              { label: "Resolution rate", value: `${resRate}%`, tone: "green" },
              { label: "Critical alerts", value: critCount.toLocaleString(), tone: "red" },
              { label: "Brands", value: String(meta.brands), tone: "default" },
              { label: "Uploads", value: String(meta.uploads), tone: "default" },
            ].map(s => (
              <div key={s.label} className={styles.statTile}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={`${styles.statValue} ${s.tone === "green" ? styles.statGreen : s.tone === "red" ? styles.statRed : ""}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className={styles.brandPanel}>
            <div className={styles.panelLabel}>Brand breakdown</div>
            {byBrand.map((b) => {
              const total = Math.max(b.total, 1);
              const resPct = Math.round((b.resolved / total) * 100);
              const critR = Math.round(((b.critical ?? 0) / Math.max((b.critical ?? 0) + (b.warning ?? 0), 1)) * 100);
              const h = healthLabel(resPct, critR);
              const rPct = Math.round((b.resolved / total) * 100);
              const oPct = Math.round((b.open / total) * 100);
              const uPct = Math.max(0, 100 - rPct - oPct);
              return (
                <div key={b.brand} className={styles.brandRow}>
                  <div className={styles.brandHeader}>
                    <span className={styles.brandName}>{b.brand}</span>
                    <span className={`${styles.healthBadge} ${healthClass(h.tone)}`}>{h.label}</span>
                  </div>
                  <svg className={styles.progressBar} viewBox="0 0 100 7" preserveAspectRatio="none" aria-hidden="true">
                    <rect width="100" height="7" rx="3.5" fill="var(--border)" />
                    <rect width={rPct} height="7" fill={STATUS_COLORS.resolved} />
                    <rect x={rPct} width={oPct} height="7" fill={STATUS_COLORS.open} />
                    <rect x={rPct + oPct} width={uPct} height="7" fill={STATUS_COLORS.unresolved} />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
