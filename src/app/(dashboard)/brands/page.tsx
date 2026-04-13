"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

const HEALTH_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  HEALTHY:  { color: "#16a34a", bg: "rgba(22,163,74,.08)",  border: "rgba(22,163,74,.2)",  dot: "#16a34a" },
  WARNING:  { color: "#d97706", bg: "rgba(217,119,6,.08)",  border: "rgba(217,119,6,.2)",  dot: "#d97706" },
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,.08)",  border: "rgba(220,38,38,.2)",  dot: "#dc2626" },
};
const AVATAR_COLORS = ["#5865f2","#16a34a","#dc2626","#d97706","#0ea5e9","#8b5cf6"];

interface Brand {
  id:        string;
  name:      string;
  logoUrl?:  string | null;
  createdAt: string;
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
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: "1px solid var(--border)", background: "#fff",
  fontSize: 14, color: "var(--t1)", outline: "none", boxSizing: "border-box",
};
const btn: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 12, border: "none",
  cursor: "pointer", fontWeight: 700, fontSize: 14,
};

function deriveHealth(roas: number, openAlerts: number): "HEALTHY" | "WARNING" | "CRITICAL" {
  if (openAlerts > 0 && roas < 1.5) return "CRITICAL";
  if (openAlerts > 0 || roas < 2)   return "WARNING";
  return "HEALTHY";
}

// ── Brand Avatar: logo image or coloured initial ──────────────────────────────
function BrandAvatar({ brand, size = 36, colorIndex = 0 }: { brand: Brand; size?: number; colorIndex?: number }) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  if (brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.name}
        style={{ width: size, height: size, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: size * 0.36, flexShrink: 0 }}>
      {brand.name[0].toUpperCase()}
    </div>
  );
}

// ── Logo Upload Widget ────────────────────────────────────────────────────────
function LogoUpload({
  currentUrl,
  onUploaded,
  onRemove,
}: {
  currentUrl?: string | null;
  onUploaded:  (url: string) => void;
  onRemove:    () => void;
}) {
  const fileRef             = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]   = useState("");

  // Sync preview when currentUrl changes (e.g. editing a different brand)
  useEffect(() => { setPreview(currentUrl ?? null); setError(""); }, [currentUrl]);

  async function handleFile(file: File) {
    setError("");
    // Client-side validation
    const ALLOWED = ["image/png","image/jpeg","image/jpg","image/svg+xml","image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setError("Allowed formats: PNG, JPG, SVG, WEBP"); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2 MB"); return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/uploads/logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPreview(currentUrl ?? null);
    } finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    onRemove();
  }

  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 800, color: "var(--t2)", textTransform: "uppercase" as const, letterSpacing: ".12em", marginBottom: 8, display: "block" }}>
        Brand Logo <span style={{ color: "var(--t3)", fontWeight: 400, fontSize: 10, textTransform: "none" as const }}>(PNG, JPG, SVG, WEBP · max 2 MB)</span>
      </label>

      {preview ? (
        // ── Preview state ──────────────────────────────────────────────────
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 12, background: "#f8fafc" }}>
          <img src={preview} alt="Logo preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>Logo uploaded</p>
            <p style={{ fontSize: 11, color: "var(--t3)" }}>Click "Change" to replace</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", cursor: "pointer", color: "var(--t1)" }}>
              {uploading ? "Uploading..." : "Change"}
            </button>
            <button type="button" onClick={handleRemove}
              style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(220,38,38,.2)", background: "rgba(220,38,38,.06)", cursor: "pointer", color: "#dc2626" }}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        // ── Drop zone ──────────────────────────────────────────────────────
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", background: "#fafafa", transition: "border-color 0.15s", opacity: uploading ? 0.7 : 1 }}
          onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = "#5865f2"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(88,101,242,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5865f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
            {uploading ? "Uploading..." : "Click or drag to upload logo"}
          </p>
          <p style={{ fontSize: 11, color: "var(--t3)" }}>PNG, JPG, SVG, WEBP · max 2 MB</p>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}

      <input
        ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function BrandsPage() {
  const [brands,  setBrands]  = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Create dialog state ───────────────────────────────────────────────────
  const [createOpen,   setCreateOpen]   = useState(false);
  const [createName,   setCreateName]   = useState("");
  const [createLogoUrl,setCreateLogoUrl]= useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  // ── Edit dialog state ─────────────────────────────────────────────────────
  const [editOpen,    setEditOpen]    = useState(false);
  const [editBrand,   setEditBrand]   = useState<Brand | null>(null);
  const [editName,    setEditName]    = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
  const [editSaving,  setEditSaving]  = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [msg,    setMsg]    = useState("");

  const token = () => sessionStorage.getItem("access_token") ?? "";
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const res  = await fetch("/api/brands", { headers, credentials: "include" });
      if (!res.ok) throw new Error("Failed to load brands");
      const data = await res.json();
      const list: Brand[] = data.items ?? [];

      const enriched = await Promise.all(list.map(async b => {
        try {
          const [kpisRes, membersRes, uploadsRes, alertsRes] = await Promise.all([
            fetch(`/api/analytics/kpis?brandId=${b.id}`,          { headers, credentials: "include" }),
            fetch(`/api/brands/${b.id}/members`,                   { headers, credentials: "include" }),
            fetch(`/api/uploads?brandId=${b.id}&pageSize=1`,       { headers, credentials: "include" }),
            fetch(`/api/alerts?brandId=${b.id}&status=OPEN`,       { headers, credentials: "include" }),
          ]);
          const kpis    = kpisRes.ok    ? (await kpisRes.json()).kpis      : null;
          const members = membersRes.ok ? (await membersRes.json()).totalItems : 0;
          const uploads = uploadsRes.ok ? (await uploadsRes.json()).totalItems : 0;
          const alerts  = alertsRes.ok  ? (await alertsRes.json()).totalItems  : 0;
          const roas       = kpis ? Number(kpis.avgRoas)   : 0;
          const spend      = kpis ? Number(kpis.totalSpend): 0;
          const openAlerts = Number(alerts) || 0;
          return { ...b, members: Number(members)||0, uploads: Number(uploads)||0, roas, spend, openAlerts, health: deriveHealth(roas, openAlerts) };
        } catch {
          return { ...b, members: 0, uploads: 0, roas: 0, spend: 0, openAlerts: 0, health: "HEALTHY" as const };
        }
      }));
      setBrands(enriched);
    } catch {
      flash("Error: Failed to load brands");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBrands(); }, [loadBrands]);

  // ── Create brand ───────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name: createName.trim(), logoUrl: createLogoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setCreateOpen(false); setCreateName(""); setCreateLogoUrl(null);
      flash("Brand created successfully");
      await loadBrands();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally { setSaving(false); }
  }

  // ── Edit brand ────────────────────────────────────────────────────────────
  function openEdit(b: Brand) {
    setEditBrand(b); setEditName(b.name); setEditLogoUrl(b.logoUrl ?? null);
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editBrand || !editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/brands/${editBrand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name: editName.trim(), logoUrl: editLogoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setEditOpen(false); setEditBrand(null);
      flash("Brand updated");
      await loadBrands();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally { setEditSaving(false); }
  }

  const enriched = brands.map(b => ({ ...b, health: b.health ?? "HEALTHY" }));
  const filtered = enriched.filter(b =>
    (filter === "ALL" || b.health === filter) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">BRANDS</div>
          <h1 className="dashboard-title">Workspace brands</h1>
          <p className="dashboard-subtitle">Manage client workspaces and review health, spend, ROAS, and alert coverage.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <button onClick={() => setCreateOpen(true)} className="btn-primary">+ New Brand</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Total",    value: loading ? "-" : enriched.length,                                    color: "#5865f2" },
          { label: "Healthy",  value: loading ? "-" : enriched.filter(b => b.health === "HEALTHY").length, color: "#16a34a" },
          { label: "Warning",  value: loading ? "-" : enriched.filter(b => b.health === "WARNING").length, color: "#d97706" },
          { label: "Critical", value: loading ? "-" : enriched.filter(b => b.health === "CRITICAL").length,color: "#dc2626" },
        ].map(st => (
          <div key={st.label} className="dashboard-card" style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8 }}>{st.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: st.color }}>{st.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={msg.startsWith("Error") ? "dashboard-banner-error" : "dashboard-card"}
          style={!msg.startsWith("Error") ? { padding: "14px 18px", color: "#16a34a" } : undefined}>
          {msg}
        </div>
      )}

      {/* Search + filter */}
      <div className="dashboard-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input style={inp} placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="dashboard-pill-tabs">
            {["ALL","HEALTHY","WARNING","CRITICAL"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`dashboard-pill-tab ${filter === f ? "dashboard-pill-tab-active" : ""}`}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-table-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "56px 0", color: "var(--t3)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Loading brands...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon"><BriefcaseIcon /></div>
            <div className="dashboard-empty-title">No brands found</div>
            <div className="dashboard-empty-subtitle">Create a brand or adjust filters.</div>
            <div className="dashboard-empty-action"><button onClick={() => setCreateOpen(true)} className="btn-primary">Create a brand</button></div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "#f8fafc" }}>
                {["Brand","Members","Uploads","Health","Spend","ROAS","Alerts","Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".12em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const hc    = HEALTH_CFG[b.health!];
                const since = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={b.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>

                    {/* Brand column — now shows logo */}
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <BrandAvatar brand={b} size={36} colorIndex={i} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: "var(--t3)" }}>Created {since}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px", color: "var(--t2)", fontSize: 14 }}>{b.members}</td>
                    <td style={{ padding: "16px", color: "var(--t2)", fontSize: 14 }}>{b.uploads}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: hc.bg, color: hc.color, border: `1px solid ${hc.border}`, fontSize: 12, fontWeight: 700 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: hc.dot }} />
                        {b.health}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontWeight: 700, fontSize: 14 }}>
                      {b.spend && b.spend > 0 ? `$${b.spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td style={{ padding: "16px", fontWeight: 700, fontSize: 14, color: (b.roas ?? 0) >= 2 ? "#16a34a" : "#dc2626" }}>
                      {b.roas && b.roas > 0 ? `${b.roas.toFixed(1)}x` : "—"}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {(b.openAlerts ?? 0) > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
                          {b.openAlerts} open
                        </span>
                      ) : <span style={{ fontSize: 12, color: "var(--t3)" }}>None</span>}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(b)} className="btn-secondary" style={{ padding: "8px 14px" }}>Edit</button>
                        <button onClick={() => navigator.clipboard.writeText(b.id).then(() => { flash("ID copied"); })} className="btn-secondary" style={{ padding: "8px 14px" }}>Copy ID</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── CREATE BRAND DIALOG ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader icon={<BriefcaseIcon />} title="New Brand" description="Create a new client workspace" onClose={() => setCreateOpen(false)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "var(--t2)", textTransform: "uppercase" as const, letterSpacing: ".12em", marginBottom: 8, display: "block" }}>
                Brand Name
              </label>
              <input style={inp} placeholder="e.g. TechCorp" value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()} autoFocus />
              <p style={{ fontSize: 12, color: "var(--t3)", margin: "6px 0 0" }}>A new workspace will be created for this brand.</p>
            </div>
            {/* Logo upload */}
            <LogoUpload
              currentUrl={createLogoUrl}
              onUploaded={url => setCreateLogoUrl(url)}
              onRemove={() => setCreateLogoUrl(null)}
            />
          </div>
          <DialogFooter>
            <button onClick={() => { setCreateOpen(false); setCreateName(""); setCreateLogoUrl(null); }} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !createName.trim()}
              style={{ ...btn, background: "#5865f2", color: "#fff", opacity: saving || !createName.trim() ? 0.6 : 1 }}>
              {saving ? "Creating..." : "Create Brand"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT BRAND DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader icon={<BriefcaseIcon />} title="Edit Brand" description="Update brand name and logo" onClose={() => setEditOpen(false)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: "var(--t2)", textTransform: "uppercase" as const, letterSpacing: ".12em", marginBottom: 8, display: "block" }}>
                Brand Name
              </label>
              <input style={inp} value={editName} onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEdit()} autoFocus />
            </div>
            {/* Logo upload */}
            <LogoUpload
              currentUrl={editLogoUrl}
              onUploaded={url => setEditLogoUrl(url)}
              onRemove={() => setEditLogoUrl(null)}
            />
          </div>
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleEdit} disabled={editSaving || !editName.trim()}
              style={{ ...btn, background: "#5865f2", color: "#fff", opacity: editSaving || !editName.trim() ? 0.6 : 1 }}>
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}