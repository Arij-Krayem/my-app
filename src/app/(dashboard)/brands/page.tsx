"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import styles from "./page.module.css";

const HEALTH_CLASS: Record<NonNullable<Brand["health"]>, string> = {
  HEALTHY: styles.healthHealthy,
  WARNING: styles.healthWarning,
  CRITICAL: styles.healthCritical,
};
const AVATAR_CLASSES = [styles.avatarColor0, styles.avatarColor1, styles.avatarColor2, styles.avatarColor3, styles.avatarColor4, styles.avatarColor5];

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

const BRAND_NAME_PATTERN = /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;
const BRAND_NAME_ERROR = "Brand name should only contain letters.";

function deriveHealth(roas: number, openAlerts: number): "HEALTHY" | "WARNING" | "CRITICAL" {
  if (openAlerts > 0 && roas < 1.5) return "CRITICAL";
  if (openAlerts > 0 || roas < 2)   return "WARNING";
  return "HEALTHY";
}

// ── Brand Avatar: logo image or coloured initial ──────────────────────────────
function BrandAvatar({ brand, colorIndex = 0 }: { brand: Brand; size?: number; colorIndex?: number }) {
  if (brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.name}
        className={styles.brandAvatarImage}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className={`${styles.brandAvatar} ${AVATAR_CLASSES[colorIndex % AVATAR_CLASSES.length]}`}>
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
      <label className={styles.fieldLabel}>
        Brand Logo <span className={styles.labelHint}>(PNG, JPG, SVG, WEBP · max 2 MB)</span>
      </label>

      {preview ? (
        // ── Preview state ──────────────────────────────────────────────────
        <div className={styles.logoPreview}>
          <img src={preview} alt="Logo preview" className={styles.logoImage} />
          <div className={styles.logoMeta}>
            <p className={styles.logoTitle}>Logo uploaded</p>
            <p className={styles.logoHelp}>Click &quot;Change&quot; to replace</p>
          </div>
          <div className={styles.logoActions}>
            <button type="button" onClick={() => fileRef.current?.click()}
              className={styles.miniButton}>
              {uploading ? "Uploading..." : "Change"}
            </button>
            <button type="button" onClick={handleRemove}
              className={styles.miniDangerButton}>
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
          className={`${styles.dropZone} ${uploading ? styles.dropZoneUploading : ""}`}
        >
          <div className={styles.uploadIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5865f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className={styles.uploadText}>
            {uploading ? "Uploading..." : "Click or drag to upload logo"}
          </p>
          <p className={styles.uploadHint}>PNG, JPG, SVG, WEBP · max 2 MB</p>
        </div>
      )}

      {error && (
        <p className={styles.errorText}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </p>
      )}

      <input
        ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        className={styles.hiddenInput}
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
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

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
    const trimmedName = createName.trim();
    if (!trimmedName || !BRAND_NAME_PATTERN.test(trimmedName)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name: trimmedName, logoUrl: createLogoUrl }),
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

  async function handleDelete() {
    if (!deleteBrand) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/brands/${deleteBrand.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete brand");

      setBrands(prev => prev.filter(b => b.id !== deleteBrand.id));
      setDeleteBrand(null);
      flash("Brand deleted successfully");
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed to delete brand"}`);
    } finally {
      setDeleteSaving(false);
    }
  }

  const enriched = brands.map(b => ({ ...b, health: b.health ?? "HEALTHY" }));
  const filtered = enriched.filter(b =>
    (filter === "ALL" || b.health === filter) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );
  const createNameTrimmed = createName.trim();
  const createNameError = createNameTrimmed && !BRAND_NAME_PATTERN.test(createNameTrimmed) ? BRAND_NAME_ERROR : "";
  const canCreateBrand = Boolean(createNameTrimmed) && !createNameError;

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
      <div className={styles.statsGrid}>
        {[
          { label: "Total",    value: loading ? "-" : enriched.length,                                    className: styles.statTotal },
          { label: "Healthy",  value: loading ? "-" : enriched.filter(b => b.health === "HEALTHY").length, className: styles.statHealthy },
          { label: "Warning",  value: loading ? "-" : enriched.filter(b => b.health === "WARNING").length, className: styles.statWarning },
          { label: "Critical", value: loading ? "-" : enriched.filter(b => b.health === "CRITICAL").length,className: styles.statCritical },
        ].map(st => (
          <div key={st.label} className={`dashboard-card ${styles.statCard}`}>
            <div className={styles.statLabel}>{st.label}</div>
            <div className={`${styles.statValue} ${st.className}`}>{st.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={!msg.startsWith("Error") ? `dashboard-card ${styles.successBanner}` : "dashboard-banner-error"}>
          {msg}
        </div>
      )}

      {/* Search + filter */}
      <div className={`dashboard-card ${styles.searchCard}`}>
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <input className={styles.input} placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} />
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
          <div className={styles.loadingState}>
            <div className={styles.loader} />
            <div className={styles.loadingText}>Loading brands...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon"><BriefcaseIcon /></div>
            <div className="dashboard-empty-title">No brands found</div>
            <div className="dashboard-empty-subtitle">Create a brand or adjust filters.</div>
            <div className="dashboard-empty-action"><button onClick={() => setCreateOpen(true)} className="btn-primary">Create a brand</button></div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                {["Brand","Members","Uploads","Health","Spend","ROAS","Alerts","Actions"].map(h => (
                  <th key={h} className={styles.headCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const healthClass = HEALTH_CLASS[b.health!];
                const since = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={b.id} className={styles.tableRow}>

                    {/* Brand column — now shows logo */}
                    <td className={styles.cell}>
                      <div className={styles.brandCell}>
                        <BrandAvatar brand={b} size={36} colorIndex={i} />
                        <div>
                          <div className={styles.brandName}>{b.name}</div>
                          <div className={styles.createdText}>Created {since}</div>
                        </div>
                      </div>
                    </td>

                    <td className={styles.mutedCell}>{b.members}</td>
                    <td className={styles.mutedCell}>{b.uploads}</td>
                    <td className={styles.cell}>
                      <span className={`${styles.healthBadge} ${healthClass}`}>
                        <span className={styles.healthDot} />
                        {b.health}
                      </span>
                    </td>
                    <td className={styles.strongCell}>
                      {b.spend && b.spend > 0 ? `$${b.spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                    </td>
                    <td className={`${styles.strongCell} ${(b.roas ?? 0) >= 2 ? styles.roasGood : styles.roasBad}`}>
                      {b.roas && b.roas > 0 ? `${b.roas.toFixed(1)}x` : "—"}
                    </td>
                    <td className={styles.cell}>
                      {(b.openAlerts ?? 0) > 0 ? (
                        <span className={styles.openAlertsBadge}>
                          {b.openAlerts} open
                        </span>
                      ) : <span className={styles.noneText}>None</span>}
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rowActions}>
                        <button onClick={() => openEdit(b)} className={`btn-secondary ${styles.smallButton}`}>Edit</button>
                        <button onClick={() => navigator.clipboard.writeText(b.id).then(() => { flash("ID copied"); })} className={`btn-secondary ${styles.smallButton}`}>Copy ID</button>
                        <button
                          onClick={() => setDeleteBrand(b)}
                          className={`btn-secondary ${styles.smallButton} ${styles.deleteButton}`}
                        >
                          Delete
                        </button>
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
        <DialogContent className={styles.dialogContent}>
          <DialogHeader icon={<BriefcaseIcon />} title="New Brand" description="Create a new client workspace" onClose={() => setCreateOpen(false)} />
          <div className={styles.dialogStack}>
            {/* Name */}
            <div>
              <label className={styles.fieldLabel}>
                Brand Name
              </label>
              <input className={`${styles.input} ${createNameError ? styles.inputError : ""}`} placeholder="e.g. TechCorp" value={createName}
                onChange={e => setCreateName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()} autoFocus />
              {createNameError ? (
                <p className={styles.errorText}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {createNameError}
                </p>
              ) : (
                <p className={styles.helperText}>A new workspace will be created for this brand.</p>
              )}
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
            <button onClick={handleCreate} disabled={saving || !canCreateBrand}
              className={`${styles.dialogButton} ${saving || !canCreateBrand ? styles.dialogButtonDisabled : ""}`}>
              {saving ? "Creating..." : "Create Brand"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT BRAND DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader icon={<BriefcaseIcon />} title="Edit Brand" description="Update brand name and logo" onClose={() => setEditOpen(false)} />
          <div className={styles.dialogStack}>
            {/* Name */}
            <div>
              <label className={styles.fieldLabel}>
                Brand Name
              </label>
              <input className={styles.input} value={editName} onChange={e => setEditName(e.target.value)}
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
              className={`${styles.dialogButton} ${editSaving || !editName.trim() ? styles.dialogButtonDisabled : ""}`}>
              {editSaving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteBrand !== null} onOpenChange={() => !deleteSaving && setDeleteBrand(null)}>
        <DialogContent className={styles.deleteDialog}>
          <DialogHeader
            icon={<span className={styles.deleteIcon}>!</span>}
            title="Delete Brand?"
            description={`Are you sure you want to delete this brand${deleteBrand ? `, ${deleteBrand.name}` : ""}? This will remove its related data as well.`}
            onClose={() => !deleteSaving && setDeleteBrand(null)}
          />
          <DialogFooter>
            <button onClick={() => setDeleteBrand(null)} className="btn-secondary" disabled={deleteSaving}>Cancel</button>
            <button onClick={handleDelete} disabled={deleteSaving} className={`${styles.dangerDialogButton} ${deleteSaving ? styles.dialogButtonDisabled : ""}`}>
              {deleteSaving ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
