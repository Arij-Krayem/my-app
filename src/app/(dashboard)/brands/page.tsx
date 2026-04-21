"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { apiFetch } from "@/lib/apiFetch";
import {
  cardStyle,
  emptyIconWrapStyle,
  emptyStateWrapStyle,
  emptySubtitleStyle,
  emptyTitleStyle,
  metricCardStyle,
  pageEyebrowStyle,
  pageSubtitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  subtleInputStyle,
  tableCellStyle,
  tableHeaderRowStyle,
  tableHeadingStyle,
  pillStyle,
} from "@/components/dashboard/designSystem";

const HEALTH_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  HEALTHY: { color: "#16a34a", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.22)", dot: "#16a34a" },
  WARNING: { color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)", dot: "#d97706" },
  CRITICAL: { color: "#dc2626", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.22)", dot: "#dc2626" },
};

const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9", "#8b5cf6"];

interface Brand {
  id: string;
  name: string;
  createdAt: string;
  members?: number;
  uploads?: number;
  health?: "HEALTHY" | "WARNING" | "CRITICAL";
  roas?: number;
  spend?: number;
  openAlerts?: number;
}

function deriveHealth(roas: number, openAlerts: number): "HEALTHY" | "WARNING" | "CRITICAL" {
  if (openAlerts > 0 && roas < 1.5) return "CRITICAL";
  if (openAlerts > 0 || roas < 2) return "WARNING";
  return "HEALTHY";
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items?: Brand[] }>("/api/brands");
      const list: Brand[] = data.items ?? [];
      console.log("[brands] brands response", data);

      const enriched = await Promise.all(
        list.map(async (brand) => {
          try {
            const [kpis, members, uploads, alerts] = await Promise.all([
              apiFetch<{ kpis?: { avgRoas?: number; totalSpend?: number } }>(`/api/analytics/kpis?brandId=${brand.id}`),
              apiFetch<{ totalItems?: number }>(`/api/brands/${brand.id}/members`),
              apiFetch<{ totalItems?: number }>(`/api/uploads?brandId=${brand.id}&pageSize=1`),
              apiFetch<{ totalItems?: number }>(`/api/alerts?brandId=${brand.id}&status=OPEN`),
            ]);
            const roas = Number(kpis.kpis?.avgRoas ?? 0);
            const spend = Number(kpis.kpis?.totalSpend ?? 0);
            const openAlerts = Number(alerts.totalItems ?? 0);

            return {
              ...brand,
              members: Number(members.totalItems ?? 0) || 0,
              uploads: Number(uploads.totalItems ?? 0) || 0,
              roas,
              spend,
              openAlerts,
              health: deriveHealth(roas, openAlerts),
            };
          } catch (fetchError) {
            console.error(`[brands] Failed to enrich brand ${brand.id}`, fetchError);
            return { ...brand, members: 0, uploads: 0, roas: 0, spend: 0, openAlerts: 0, health: "HEALTHY" as const };
          }
        }),
      );

      setBrands(enriched);
    } catch (fetchError) {
      console.error("[brands] Failed to load brands", fetchError);
      setMsg(`Error: ${fetchError instanceof Error ? fetchError.message : "Failed to load brands"}`);
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/brands", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setOpen(false);
      setName("");
      setMsg("Brand created successfully");
      setTimeout(() => setMsg(""), 2500);
      await loadBrands();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setMsg(`Error: ${message}`);
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  const filtered = brands.filter(
    (brand) =>
      (filter === "ALL" || brand.health === filter) &&
      brand.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={pageEyebrowStyle}>Brands</div>
          <p style={pageSubtitleStyle}>Manage client workspaces and review health, spend, ROAS, and alert coverage in a single standardized table.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} style={primaryButtonStyle}>
          + New Brand
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total", value: loading ? "--" : brands.length, color: "#4f46e5" },
          { label: "Healthy", value: loading ? "--" : brands.filter((brand) => brand.health === "HEALTHY").length, color: "#16a34a" },
          { label: "Warning", value: loading ? "--" : brands.filter((brand) => brand.health === "WARNING").length, color: "#d97706" },
          { label: "Critical", value: loading ? "--" : brands.filter((brand) => brand.health === "CRITICAL").length, color: "#dc2626" },
        ].map((item) => (
          <div key={item.label} style={metricCardStyle}>
            <div style={{ color: item.color, fontSize: 28, fontWeight: 700 }}>{item.value}</div>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 16,
            padding: "14px 16px",
            background: msg.startsWith("Error") ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
            borderColor: msg.startsWith("Error") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
            color: msg.startsWith("Error") ? "#dc2626" : "#15803d",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ ...cardStyle, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...subtleInputStyle, maxWidth: 320 }} placeholder="Search brands..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["ALL", "HEALTHY", "WARNING", "CRITICAL"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                style={filter === item ? primaryButtonStyle : secondaryButtonStyle}
              >
                {item === "ALL" ? "All" : `${item.charAt(0)}${item.slice(1).toLowerCase()}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading ? (
          <div style={emptyStateWrapStyle}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.12)", borderTopColor: "#6366F1", animation: "spin 0.8s linear infinite" }} />
            <p style={{ ...emptySubtitleStyle, marginTop: 18 }}>Loading brands...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={emptyStateWrapStyle}>
            <div style={emptyIconWrapStyle}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </div>
            <h2 style={emptyTitleStyle}>No brands found</h2>
            <p style={emptySubtitleStyle}>Create a brand or adjust the current search and status filters.</p>
            <button type="button" onClick={() => setOpen(true)} style={{ ...primaryButtonStyle, marginTop: 20 }}>
              Create a brand
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  {["Brand", "Members", "Uploads", "Health", "Spend", "ROAS", "Alerts", "Actions"].map((heading) => (
                    <th key={heading} style={tableHeadingStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand, index) => {
                  const health = HEALTH_CFG[brand.health ?? "HEALTHY"];
                  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const since = new Date(brand.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={brand.id}
                      style={{ background: index % 2 === 0 ? "#fff" : "#fcfcff" }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = "rgba(99,102,241,0.03)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fcfcff";
                      }}
                    >
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                            {brand.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>{brand.name}</div>
                            <div style={{ color: "#94a3b8", fontSize: 12 }}>Created {since}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tableCellStyle}>{brand.members}</td>
                      <td style={tableCellStyle}>{brand.uploads}</td>
                      <td style={tableCellStyle}>
                        <span style={{ ...pillStyle(health.color, health.bg, health.border), gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: health.dot }} />
                          {brand.health}
                        </span>
                      </td>
                      <td style={tableCellStyle}>{brand.spend && brand.spend > 0 ? `$${brand.spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "--"}</td>
                      <td style={{ ...tableCellStyle, color: (brand.roas ?? 0) >= 2 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                        {brand.roas && brand.roas > 0 ? `${brand.roas.toFixed(1)}x` : "--"}
                      </td>
                      <td style={tableCellStyle}>
                        {(brand.openAlerts ?? 0) > 0 ? (
                          <span style={pillStyle("#ef4444", "rgba(239,68,68,0.1)", "rgba(239,68,68,0.22)")}>{brand.openAlerts} open</span>
                        ) : (
                          "None"
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(brand.id).then(() => {
                              setMsg("Brand ID copied");
                              setTimeout(() => setMsg(""), 1500);
                            });
                          }}
                          style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}
                        >
                          Copy ID
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            }
            title="New Brand"
            description="Create a new client workspace"
            onClose={() => setOpen(false)}
          />
          <div style={{ padding: "20px 24px 0" }}>
            <label style={{ display: "block", marginBottom: 8, color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Brand Name
            </label>
            <input
              style={{ ...subtleInputStyle, minHeight: 46 }}
              placeholder="e.g. Maison de Senteurs"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void handleCreate()}
              autoFocus
            />
            <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>A new workspace will be created for this brand.</p>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleCreate()} disabled={saving || !name.trim()} style={{ ...primaryButtonStyle, opacity: saving || !name.trim() ? 0.65 : 1 }}>
              {saving ? "Creating..." : "Create Brand"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
