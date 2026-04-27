"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import AvatarUploadField from "@/components/AvatarUploadField";
import UserAvatar from "@/components/UserAvatar";
import { readSessionUser, writeSessionUser } from "@/lib/session-user";

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

const ROLE_CFG: Record<Role, { color: string; bg: string; border: string }> = {
  AGENCY_ADMIN: { color: "#dc2626", bg: "rgba(220,38,38,.08)", border: "rgba(220,38,38,.2)" },
  MARKETER:     { color: "#16a34a", bg: "rgba(22,163,74,.08)",  border: "rgba(22,163,74,.2)" },
};
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12,
  border: "1px solid var(--border)", background: "#fff",
  fontSize: 14, color: "var(--t1)", outline: "none", boxSizing: "border-box",
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };
const btn: React.CSSProperties = { padding: "9px 20px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "var(--t2)", textTransform: "uppercase" as const, letterSpacing: ".12em", marginBottom: 6, display: "block" };

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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {brands.map(b => (
        <div key={b.id} onClick={() => toggleBrand(b.id, form, setForm)}
          style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .15s", border: form.brandIds.includes(b.id) ? "1px solid #5865f2" : "1px solid var(--border)", background: form.brandIds.includes(b.id) ? "rgba(88,101,242,.08)" : "#fff", color: form.brandIds.includes(b.id) ? "#5865f2" : "var(--t2)" }}>
          {b.name}
        </div>
      ))}
      {brands.length === 0 && <p style={{ fontSize: 12, color: "var(--t3)" }}>No brands available</p>}
    </div>
  );

  const FormBody = ({ form, setForm, isInvite }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void; isInvite?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!isInvite && (
        <AvatarUploadField
          currentUrl={form.avatarUrl}
          name={form.name}
          email={form.email}
          onUploaded={url => setForm({ ...form, avatarUrl: url })}
          onRemove={() => setForm({ ...form, avatarUrl: null })}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Full Name</label>
          <input style={inp} placeholder="Jane Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>Email</label>
          <input style={inp} type="email" placeholder="jane@co.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!isInvite} />
        </div>
      </div>
      {isInvite && (
        <div>
          <label style={lbl}>Password</label>
          <input style={inp} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
      )}
      <div>
        <label style={lbl}>Role</label>
        <select style={sel} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
          <option value="MARKETER">Marketer</option>
          <option value="AGENCY_ADMIN">Agency Admin</option>
        </select>
      </div>
      <div>
        <label style={lbl}>Assign Brands</label>
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
        style={{
          display:     "flex", alignItems: "center", gap: 6,
          padding:     "5px 12px", borderRadius: 999, cursor: user.isApproved ? "pointer" : "not-allowed",
          fontSize:    12, fontWeight: 700, border: "1px solid",
          transition:  "all .15s", opacity: isToggling ? 0.6 : 1,
          background:  user.isActive ? "rgba(22,163,74,.1)"     : "rgba(107,114,128,.1)",
          color:       user.isActive ? "#15803d"                : "#4b5563",
          borderColor: user.isActive ? "rgba(22,163,74,.3)"     : "rgba(107,114,128,.25)",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: user.isActive ? "#16a34a" : "#9ca3af", flexShrink: 0 }} />
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { label: "Total Users",  value: loading ? "-" : users.length,    color: "#5865f2" },
          { label: "Pending",      value: loading ? "-" : pending.length,   color: "#d97706" },
          { label: "Active",       value: loading ? "-" : active.length,    color: "#16a34a" },
          { label: "Inactive",     value: loading ? "-" : inactive.length,  color: "#6b7280" },
          { label: "Brands",       value: loading ? "-" : brands.length,    color: "#0ea5e9" },
        ].map(st => (
          <div key={st.label} className="dashboard-card" style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8 }}>{st.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: st.color }}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Pending approval banner */}
      {pending.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#d97706", animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
            {pending.length} user{pending.length > 1 ? "s" : ""} waiting for approval
          </span>
          <button onClick={() => setFilter("pending")} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#d97706", background: "none", border: "1px solid rgba(217,119,6,.3)", borderRadius: 8, padding: "4px 12px", cursor: "pointer" }}>
            Review now →
          </button>
        </div>
      )}

      {msg && (
        <div className={msg.startsWith("Error") ? "dashboard-banner-error" : "dashboard-card"}
          style={!msg.startsWith("Error") ? { padding: "14px 18px", color: "#16a34a", marginBottom: 16 } : { marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {/* Search + filter tabs */}
      <div className="dashboard-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 340 }}>
          <input style={inp} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {([
            { key: "all",      label: "All" },
            { key: "pending",  label: `Pending${pending.length > 0 ? ` (${pending.length})` : ""}` },
            { key: "active",   label: "Active" },
            { key: "inactive", label: "Inactive" },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              style={{ padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1px solid", transition: "all .15s",
                background:  filter === tab.key ? "#5865f2"                : "transparent",
                color:       filter === tab.key ? "white"                  : "var(--t2)",
                borderColor: filter === tab.key ? "#5865f2"                : "var(--border)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-table-card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "56px 0", color: "var(--t3)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13 }}>Loading users...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon"><UserIcon /></div>
            <div className="dashboard-empty-title">No users found</div>
            <div className="dashboard-empty-subtitle">Invite a teammate or adjust the current search query.</div>
            <div className="dashboard-empty-action"><button onClick={() => setInviteOpen(true)} className="btn-primary">Invite a teammate</button></div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "#f8fafc" }}>
                {["User","Role","Status","Brands","Member Since","Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".12em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rc      = ROLE_CFG[u.role];
                const since    = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const isPending = !u.isApproved;
                return (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", background: isPending ? "rgba(245,158,11,0.03)" : "transparent" }}>

                    {/* User */}
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <UserAvatar name={u.name} email={u.email} avatarUrl={u.avatarUrl} size={40} borderRadius={12} colorIndex={i} />
                          {/* Pending dot */}
                          {isPending && (
                            <div style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "#d97706", border: "2px solid #fff" }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                            {u.name ?? "—"}
                            {isPending && (
                              <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(217,119,6,.12)", color: "#92400e", border: "1px solid rgba(217,119,6,.25)" }}>
                                PENDING
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--t3)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: 16 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                        {u.role === "AGENCY_ADMIN" ? "Admin" : "Marketer"}
                      </span>
                    </td>

                    {/* Status — toggle for approved users, approve button for pending */}
                    <td style={{ padding: 16 }}>
                      {isPending ? (
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={approvingId === u.id}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(88,101,242,.35)", background: "rgba(88,101,242,.08)", color: "#5865f2", opacity: approvingId === u.id ? 0.6 : 1, fontFamily: "inherit" }}
                        >
                          {approvingId === u.id ? "Approving..." : "✓ Approve"}
                        </button>
                      ) : (
                        <ActiveToggle user={u} />
                      )}
                    </td>

                    {/* Brands */}
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {u.brandMembers.length > 0 ? u.brandMembers.map(m => (
                          <span key={m.brand.id} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#f8fafc", color: "var(--t2)", fontWeight: 700, border: "1px solid var(--border)" }}>
                            {m.brand.name}
                          </span>
                        )) : <span style={{ fontSize: 12, color: "var(--t3)" }}>No brands</span>}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: 16, fontSize: 13, color: "var(--t3)" }}>{since}</td>

                    {/* Actions */}
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(u)} className="btn-secondary" style={{ padding: "8px 14px" }}>Edit</button>
                        <button onClick={() => setDelId(u.id)} className="btn-secondary" style={{ padding: "8px 14px", color: "#dc2626", borderColor: "rgba(220,38,38,.2)" }}>Delete</button>
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
              style={{ ...btn, background: "#5865f2", color: "#fff", opacity: saving || !inviteForm.name || !inviteForm.email || !inviteForm.password ? 0.6 : 1 }}>
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
              style={{ ...btn, background: "#5865f2", color: "#fff", opacity: saving || !editForm.name ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader icon={<span style={{ fontSize: 18 }}>!</span>} title="Remove User?" description="This user will lose access to all brands immediately." onClose={() => setDelId(null)} />
          <DialogFooter>
            <button onClick={() => setDelId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} style={{ ...btn, background: "#dc2626", color: "#fff" }}>Remove</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
      `}</style>
    </div>
  );
}
