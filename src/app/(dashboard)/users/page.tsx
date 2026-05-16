"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import AvatarUploadField from "@/components/user/AvatarUploadField";
import UserAvatar from "@/components/user/UserAvatar";
import { readSessionUser, writeSessionUser } from "@/lib/session/session-user";
import styles from "./page.module.css";

type Role = "AGENCY_ADMIN" | "MARKETER";

interface Brand { id: string; name: string; }
interface User {
  id:           string;
  name:         string | null;
  email:        string;
  avatarUrl?:   string | null;
  role:         Role;
  isApproved:   boolean;
  isActive:     boolean;
  createdAt:    string;
  brandMembers: { brand: Brand }[];
}

const ROLE_CLASS: Record<Role, string> = {
  AGENCY_ADMIN: styles.roleAdmin,
  MARKETER: styles.roleMarketer,
};
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const emptyForm = { name: "", email: "", password: "", role: "MARKETER" as Role, brandIds: [] as string[], avatarUrl: null as string | null };

export default function UsersPage() {
  const [users,      setUsers]      = useState<User[]>([]);
  const [brands,     setBrands]     = useState<Brand[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState<"all"|"pending"|"active"|"inactive">("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [delId,      setDelId]      = useState<string | null>(null);
  const [editUser,   setEditUser]   = useState<User | null>(null);
  const [msg,        setMsg]        = useState("");
  const [saving,     setSaving]     = useState(false);
  const [approvingId,setApprovingId]= useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState(emptyForm);
  const [editForm,   setEditForm]   = useState(emptyForm);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const flash = (m: string, duration = 3000) => { setMsg(m); setTimeout(() => setMsg(""), duration); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [usersRes, brandsRes] = await Promise.all([
        fetch("/api/users?pageSize=100", { headers, credentials: "include" }),
        fetch("/api/brands",             { headers, credentials: "include" }),
      ]);
      if (usersRes.ok)  setUsers((await usersRes.json()).items ?? []);
      if (brandsRes.ok) setBrands((await brandsRes.json()).items ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filter logic ───────────────────────────────────────────────────────────
  const pending  = users.filter(u => !u.isApproved);
  const active   = users.filter(u => u.isApproved && u.isActive);
  const inactive = users.filter(u => u.isApproved && !u.isActive);

  const filtered = users
    .filter(u => {
      if (filter === "pending")  return !u.isApproved;
      if (filter === "active")   return u.isApproved && u.isActive;
      if (filter === "inactive") return u.isApproved && !u.isActive;
      return true;
    })
    .filter(u =>
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  // ── Approve ────────────────────────────────────────────────────────────────
  async function handleApprove(userId: string) {
    setApprovingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      flash("✅ User approved — approval email sent");
      await loadData();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally { setApprovingId(null); }
  }

  // ── Toggle active / inactive ───────────────────────────────────────────────
  async function handleToggleActive(u: User) {
    setTogglingId(u.id);
    try {
      const res = await fetch(`/api/users?id=${u.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      flash(`User ${!u.isActive ? "activated" : "deactivated"}`);
      await loadData();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally { setTogglingId(null); }
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name: u.name ?? "", email: u.email, password: "", role: u.role, brandIds: u.brandMembers.map(m => m.brand.id), avatarUrl: u.avatarUrl ?? null });
    setEditOpen(true);
  }

  async function handleInvite() {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setInviteOpen(false);
      setInviteForm(emptyForm);
      flash("User created successfully");
      await loadData();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editUser) return;
    setSaving(true);
    try {
      const previousBrandIds = editUser.brandMembers.map(m => m.brand.id).sort();
      const nextBrandIds = [...editForm.brandIds].sort();
      const brandsChanged =
        previousBrandIds.length !== nextBrandIds.length ||
        previousBrandIds.some((brandId, index) => brandId !== nextBrandIds[index]);

      const res = await fetch(`/api/users?id=${editUser.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name: editForm.name, role: editForm.role, brandIds: editForm.brandIds, avatarUrl: editForm.avatarUrl }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const currentUser = readSessionUser();
      if (currentUser?.id === editUser.id) {
        writeSessionUser({
          ...currentUser,
          name: editForm.name,
          role: editForm.role,
          avatarUrl: editForm.avatarUrl,
        });
      }
      setEditOpen(false);
      flash(
        brandsChanged
          ? `Brand assignments updated successfully for ${editForm.name || editUser.email}.`
          : "User updated",
        brandsChanged ? 30000 : 3000,
      );
      await loadData();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!delId) return;
    try {
      const res = await fetch(`/api/users?id=${delId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDelId(null);
      flash("User removed");
      await loadData();
    } catch (e: unknown) {
      flash(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    }
  }

  function toggleBrand(brandId: string, form: typeof emptyForm, setForm: (f: typeof emptyForm) => void) {
    setForm({ ...form, brandIds: form.brandIds.includes(brandId) ? form.brandIds.filter(b => b !== brandId) : [...form.brandIds, brandId] });
  }

  const BrandPills = ({ form, setForm }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void }) => (
    <div className={styles.brandPills}>
      {brands.map(b => (
        <div key={b.id} onClick={() => toggleBrand(b.id, form, setForm)}
          className={`${styles.brandPill} ${form.brandIds.includes(b.id) ? styles.brandPillActive : ""}`}>
          {b.name}
        </div>
      ))}
      {brands.length === 0 && <p className={styles.emptyBrands}>No brands available</p>}
    </div>
  );

  const FormBody = ({ form, setForm, isInvite }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void; isInvite?: boolean }) => (
    <div className={styles.formStack}>
      {!isInvite && (
        <AvatarUploadField
          currentUrl={form.avatarUrl}
          name={form.name}
          email={form.email}
          onUploaded={url => setForm({ ...form, avatarUrl: url })}
          onRemove={() => setForm({ ...form, avatarUrl: null })}
        />
      )}
      <div className={styles.formGrid}>
        <div>
          <label className={styles.label}>Full Name</label>
          <input className={styles.input} placeholder="Jane Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="jane@co.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!isInvite} />
        </div>
      </div>
      {isInvite && (
        <div>
          <label className={styles.label}>Password</label>
          <input className={styles.input} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
      )}
      <div>
        <label className={styles.label}>Role</label>
        <select className={styles.select} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
          <option value="MARKETER">Marketer</option>
          <option value="AGENCY_ADMIN">Agency Admin</option>
        </select>
      </div>
      <div>
        <label className={styles.label}>Assign Brands</label>
        <BrandPills form={form} setForm={setForm} />
      </div>
    </div>
  );

  // ── Active/Inactive toggle pill ────────────────────────────────────────────
  function ActiveToggle({ user }: { user: User }) {
    const isToggling = togglingId === user.id;
    return (
      <button
        onClick={() => handleToggleActive(user)}
        disabled={isToggling || !user.isApproved}
        title={!user.isApproved ? "Approve user first" : user.isActive ? "Click to deactivate" : "Click to activate"}
        className={`${styles.activeToggle} ${user.isActive ? styles.activeToggleOn : styles.activeToggleOff} ${!user.isApproved ? styles.activeToggleDisabled : ""} ${isToggling ? styles.activeToggleLoading : ""}`}
      >
        <span className={styles.activeDot} />
        {isToggling ? "..." : user.isActive ? "Active" : "Inactive"}
      </button>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">USERS</div>
          <h1 className="dashboard-title">Team access</h1>
          <p className="dashboard-subtitle">Manage teammates, approve accounts, and control brand access.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <button onClick={() => setInviteOpen(true)} className="btn-primary">+ Invite User</button>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        {[
          { label: "Total Users",  value: loading ? "-" : users.length,    className: styles.statUsers },
          { label: "Pending",      value: loading ? "-" : pending.length,   className: styles.statPending },
          { label: "Active",       value: loading ? "-" : active.length,    className: styles.statActive },
          { label: "Inactive",     value: loading ? "-" : inactive.length,  className: styles.statInactive },
          { label: "Brands",       value: loading ? "-" : brands.length,    className: styles.statBrands },
        ].map(st => (
          <div key={st.label} className={`dashboard-card ${styles.statCard}`}>
            <div className={styles.statLabel}>{st.label}</div>
            <div className={`${styles.statValue} ${st.className}`}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Pending approval banner */}
      {pending.length > 0 && (
        <div className={styles.pendingBanner}>
          <div className={styles.pendingDot} />
          <span className={styles.pendingText}>
            {pending.length} user{pending.length > 1 ? "s" : ""} waiting for approval
          </span>
          <button onClick={() => setFilter("pending")} className={styles.reviewButton}>
            Review now →
          </button>
        </div>
      )}

      {msg && (
        <div className={msg.startsWith("Error") ? `dashboard-banner-error ${styles.message}` : `dashboard-card ${styles.message} ${styles.successMessage}`}>
          {msg}
        </div>
      )}

      {/* Search + filter tabs */}
      <div className={`dashboard-card ${styles.filterCard}`}>
        <div className={styles.searchWrap}>
          <input className={styles.input} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.filterTabs}>
          {([
            { key: "all",      label: "All" },
            { key: "pending",  label: `Pending${pending.length > 0 ? ` (${pending.length})` : ""}` },
            { key: "active",   label: "Active" },
            { key: "inactive", label: "Inactive" },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`${styles.filterTab} ${filter === tab.key ? styles.filterTabActive : ""}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-table-card">
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loader} />
            <div className={styles.loadingText}>Loading users...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon"><UserIcon /></div>
            <div className="dashboard-empty-title">No users found</div>
            <div className="dashboard-empty-subtitle">Invite a teammate or adjust the current search query.</div>
            <div className="dashboard-empty-action"><button onClick={() => setInviteOpen(true)} className="btn-primary">Invite a teammate</button></div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.headerRow}>
                {["User","Role","Status","Brands","Member Since","Actions"].map(h => (
                  <th key={h} className={styles.headCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const since    = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const isPending = !u.isApproved;
                return (
                  <tr key={u.id} className={`${styles.tableRow} ${isPending ? styles.pendingRow : ""}`}>

                    {/* User */}
                    <td className={styles.cell}>
                      <div className={styles.userCell}>
                        <div className={styles.avatarWrap}>
                          <UserAvatar name={u.name} email={u.email} avatarUrl={u.avatarUrl} size={40} borderRadius={12} colorIndex={i} />
                          {/* Pending dot */}
                          {isPending && (
                            <div className={styles.pendingAvatarDot} />
                          )}
                        </div>
                        <div>
                          <div className={styles.nameLine}>
                            {u.name ?? "—"}
                            {isPending && (
                              <span className={styles.pendingBadge}>
                                PENDING
                              </span>
                            )}
                          </div>
                          <div className={styles.emailText}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className={styles.cell}>
                      <span className={`${styles.roleBadge} ${ROLE_CLASS[u.role]}`}>
                        {u.role === "AGENCY_ADMIN" ? "Admin" : "Marketer"}
                      </span>
                    </td>

                    {/* Status — toggle for approved users, approve button for pending */}
                    <td className={styles.cell}>
                      {isPending ? (
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={approvingId === u.id}
                          className={`${styles.approveButton} ${approvingId === u.id ? styles.buttonLoading : ""}`}
                        >
                          {approvingId === u.id ? "Approving..." : "✓ Approve"}
                        </button>
                      ) : (
                        <ActiveToggle user={u} />
                      )}
                    </td>

                    {/* Brands */}
                    <td className={styles.cell}>
                      <div className={styles.brandList}>
                        {u.brandMembers.length > 0 ? u.brandMembers.map(m => (
                          <span key={m.brand.id} className={styles.brandTag}>
                            {m.brand.name}
                          </span>
                        )) : <span className={styles.noBrands}>No brands</span>}
                      </div>
                    </td>

                    {/* Date */}
                    <td className={styles.dateCell}>{since}</td>

                    {/* Actions */}
                    <td className={styles.cell}>
                      <div className={styles.rowActions}>
                        <button onClick={() => openEdit(u)} className={`btn-secondary ${styles.smallButton}`}>Edit</button>
                        <button onClick={() => setDelId(u.id)} className={`btn-secondary ${styles.smallButton} ${styles.deleteButton}`}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Invite User" description="Admin-created users are immediately approved and active." onClose={() => setInviteOpen(false)} />
          <FormBody form={inviteForm} setForm={setInviteForm} isInvite />
          <DialogFooter>
            <button onClick={() => setInviteOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleInvite} disabled={saving || !inviteForm.name || !inviteForm.email || !inviteForm.password}
              className={`${styles.dialogButton} ${saving || !inviteForm.name || !inviteForm.email || !inviteForm.password ? styles.dialogButtonDisabled : ""}`}>
              {saving ? "Creating..." : "Create User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Edit User" description="Update team member details and access" onClose={() => setEditOpen(false)} />
          <FormBody form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleEdit} disabled={saving || !editForm.name}
              className={`${styles.dialogButton} ${saving || !editForm.name ? styles.dialogButtonDisabled : ""}`}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent className={styles.deleteDialog}>
          <DialogHeader icon={<span className={styles.deleteIcon}>!</span>} title="Remove User?" description="This user will lose access to all brands immediately." onClose={() => setDelId(null)} />
          <DialogFooter>
            <button onClick={() => setDelId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className={styles.dangerDialogButton}>Remove</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
