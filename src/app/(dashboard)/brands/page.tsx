"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

const HEALTH_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  HEALTHY:  { color: "#16a34a", bg: "rgba(22,163,74,.08)",  border: "rgba(22,163,74,.2)",  dot: "#16a34a" },
  WARNING:  { color: "#d97706", bg: "rgba(217,119,6,.08)",  border: "rgba(217,119,6,.2)",  dot: "#d97706" },
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,.08)",  border: "rgba(220,38,38,.2)",  dot: "#dc2626" },
};

const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9", "#8b5cf6"];

interface Brand {
  id:        string;
  name:      string;
  createdAt: string;
  // enriched from KPIs + members + uploads
  members?:  number;
  uploads?:  number;
  health?:   "HEALTHY" | "WARNING" | "CRITICAL";
  roas?:     number;
  spend?:    number;
  openAlerts?: number;
}

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", background: "#f8fafc",
  fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
};
const btn: React.CSSProperties = { padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 };

function deriveHealth(roas: number, openAlerts: number): "HEALTHY" | "WARNING" | "CRITICAL" {
  if (openAlerts > 0 && roas < 1.5) return "CRITICAL";
  if (openAlerts > 0 || roas < 2)   return "WARNING";
  return "HEALTHY";
}

export default function BrandsPage() {
  const [brands,  setBrands]  = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState("");
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token()}` };

      const res  = await fetch("/api/brands", { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to load brands");
      const data = await res.json();
      const list: Brand[] = data.items ?? [];

      // Enrich each brand with KPIs, member count, upload count, alert count
      const enriched = await Promise.all(list.map(async (b) => {
        try {
          const [kpisRes, membersRes, uploadsRes, alertsRes] = await Promise.all([
            fetch(`/api/analytics/kpis?brandId=${b.id}`, { headers, credentials: "include" }),
            fetch(`/api/brands/${b.id}/members`,          { headers, credentials: "include" }),
            fetch(`/api/uploads?brandId=${b.id}&pageSize=1`, { headers, credentials: "include" }),
            fetch(`/api/alerts?brandId=${b.id}&status=OPEN`, { headers, credentials: "include" }),
          ]);

          const kpis    = kpisRes.ok    ? (await kpisRes.json()).kpis           : null;
          const members = membersRes.ok ? (await membersRes.json()).totalItems  : 0;
          const uploads = uploadsRes.ok ? (await uploadsRes.json()).totalItems  : 0;
          const alerts  = alertsRes.ok  ? (await alertsRes.json()).totalItems   : 0;

          const roas       = kpis ? Number(kpis.avgRoas) : 0;
          const spend      = kpis ? Number(kpis.totalSpend) : 0;
          const openAlerts = Number(alerts) || 0;

          return {
            ...b,
            members:    Number(members) || 0,
            uploads:    Number(uploads) || 0,
            roas,
            spend,
            openAlerts,
            health: deriveHealth(roas, openAlerts),
          };
        } catch {
          return { ...b, members: 0, uploads: 0, roas: 0, spend: 0, openAlerts: 0, health: "HEALTHY" as const };
        }
      }));

      setBrands(enriched);
    } catch {
      setMsg("Error: Failed to load brands");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBrands(); }, [loadBrands]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setOpen(false);
      setName("");
      setMsg("Brand created successfully");
      setTimeout(() => setMsg(""), 2500);
      await loadBrands();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
      setTimeout(() => setMsg(""), 3000);
    } finally { setSaving(false); }
  }

  const enriched = brands.map(b => ({ ...b, health: b.health ?? "HEALTHY" }));

  const filtered = enriched.filter(b =>
    (filter === "ALL" || b.health === filter) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-page" style={{ color: "#1e293b" }}>
      <div className="dashboard-toolbar dashboard-toolbar-end">
        <button onClick={() => setOpen(true)} style={{ ...btn, background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "#fff" }}>
          + New Brand
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total",    value: loading ? "—" : enriched.length,                                        color: "#5865f2" },
          { label: "Healthy",  value: loading ? "—" : enriched.filter(b => b.health === "HEALTHY").length,    color: "#16a34a" },
          { label: "Warning",  value: loading ? "—" : enriched.filter(b => b.health === "WARNING").length,    color: "#d97706" },
          { label: "Critical", value: loading ? "—" : enriched.filter(b => b.health === "CRITICAL").length,   color: "#dc2626" },
        ].map(st => (
          <div key={st.label} style={{ background: "#fff", border: "1px solid #e8edf2", borderRadius: 14, padding: "18px 22px" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{st.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: st.color }}>{st.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          background: msg.startsWith("Error") ? "rgba(220,38,38,.08)" : "rgba(22,163,74,.08)",
          border: `1px solid ${msg.startsWith("Error") ? "rgba(220,38,38,.25)" : "rgba(22,163,74,.25)"}`,
          borderRadius: 9, padding: "10px 16px", marginBottom: 16,
          color: msg.startsWith("Error") ? "#dc2626" : "#16a34a", fontSize: 14,
        }}>
          {msg.startsWith("Error") ? "✗" : "✓"} {msg}
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ background: "#fff", border: "1px solid #e8edf2", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
            <input style={{ ...inp, paddingLeft: 34 }} placeholder="Search brands…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "HEALTHY", "WARNING", "CRITICAL"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ ...btn, padding: "7px 14px", fontSize: 13, background: filter === f ? "#5865f2" : "#f1f5f9", color: filter === f ? "#fff" : "#475569" }}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e8edf2", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #e8edf2", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Loading brands…</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>
                {["Brand", "Members", "Uploads", "Health", "Spend", "ROAS", "Alerts", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const hc    = HEALTH_CFG[b.health!];
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const since = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={b.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background .12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {b.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>Created {since}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 14 }}>{b.members}</td>
                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: 14 }}>{b.uploads}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: hc.bg, color: hc.color, border: `1px solid ${hc.border}`, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: hc.dot }} />
                        {b.health}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14 }}>
                      {b.spend && b.spend > 0 ? `$${b.spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14, color: (b.roas ?? 0) >= 2 ? "#16a34a" : "#dc2626" }}>
                      {b.roas && b.roas > 0 ? `${b.roas.toFixed(1)}x` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {(b.openAlerts ?? 0) > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
                          {b.openAlerts} open
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(b.id).then(() => { setMsg(`ID copied`); setTimeout(() => setMsg(""), 1500); })}
                        style={{ ...btn, padding: "7px 16px", fontSize: 13, background: "#f1f5f9", color: "#5865f2" }}>
                        Copy ID
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No brands found</div>
            <div style={{ fontSize: 13 }}>Try adjusting your search or filter</div>
          </div>
        )}
      </div>

      {/* New Brand Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader icon={<BriefcaseIcon />} title="New Brand" description="Create a new client workspace" onClose={() => setOpen(false)} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, display: "block" }}>Brand Name</label>
            <input style={inp} placeholder="e.g. TechCorp" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()} autoFocus />
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0" }}>A new workspace will be created for this brand.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} style={{ ...btn, background: "#f1f5f9", color: "#475569" }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving || !name.trim()}
              style={{ ...btn, background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "#fff", opacity: saving || !name.trim() ? 0.6 : 1 }}>
              {saving ? "Creating…" : "Create Brand"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
