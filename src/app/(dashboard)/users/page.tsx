"use client";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

type Role = "AGENCY_ADMIN" | "MARKETER";

interface Brand { id: string; name: string; }
interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  brandMembers: { brand: Brand }[];
}

const ROLE_CFG: Record<Role, { color: string; bg: string; border: string }> = {
  AGENCY_ADMIN: { color: "#dc2626", bg: "rgba(220,38,38,.08)", border: "rgba(220,38,38,.2)" },
  MARKETER: { color: "#16a34a", bg: "rgba(22,163,74,.08)", border: "rgba(22,163,74,.2)" },
};
const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9"];

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

const emptyForm = { name: "", email: "", password: "", role: "MARKETER" as Role, brandIds: [] as string[] };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token()}` };
      const [usersRes, brandsRes] = await Promise.all([
        fetch("/api/users?pageSize=100", { headers, credentials: "include" }),
        fetch("/api/brands", { headers, credentials: "include" }),
      ]);
      if (usersRes.ok) setUsers((await usersRes.json()).items ?? []);
      if (brandsRes.ok) setBrands((await brandsRes.json()).items ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = users.filter(u =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({
      name: u.name ?? "",
      email: u.email,
      password: "",
      role: u.role,
      brandIds: u.brandMembers.map(m => m.brand.id),
    });
    setEditOpen(true);
  }

  async function handleInvite() {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setInviteOpen(false);
      setInviteForm(emptyForm);
      setMsg("User created successfully");
      setTimeout(() => setMsg(""), 2500);
      await loadData();
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : "Failed"}`);
      setTimeout(() => setMsg(""), 3000);
    } finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users?id=${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name: editForm.name, role: editForm.role, brandIds: editForm.brandIds }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditOpen(false);
      setMsg("User updated");
      setTimeout(() => setMsg(""), 2500);
      await loadData();
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : "Failed"}`);
      setTimeout(() => setMsg(""), 3000);
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
      setMsg("User removed");
      setTimeout(() => setMsg(""), 2500);
      await loadData();
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : "Failed"}`);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  function toggleBrand(brandId: string, form: typeof emptyForm, setForm: (f: typeof emptyForm) => void) {
    setForm({ ...form, brandIds: form.brandIds.includes(brandId) ? form.brandIds.filter(b => b !== brandId) : [...form.brandIds, brandId] });
  }

  const BrandPills = ({ form, setForm }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {brands.map(b => (
        <div
          key={b.id}
          onClick={() => toggleBrand(b.id, form, setForm)}
          style={{ padding: "6px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all .15s", border: form.brandIds.includes(b.id) ? "1px solid #5865f2" : "1px solid var(--border)", background: form.brandIds.includes(b.id) ? "rgba(88,101,242,.08)" : "#fff", color: form.brandIds.includes(b.id) ? "#5865f2" : "var(--t2)" }}
        >
          {b.name}
        </div>
      ))}
      {brands.length === 0 && <p style={{ fontSize: 12, color: "var(--t3)" }}>No brands available</p>}
    </div>
  );

  const FormBody = ({ form, setForm, isInvite }: { form: typeof emptyForm; setForm: (f: typeof emptyForm) => void; isInvite?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">USERS</div>
          <h1 className="dashboard-title">Team access</h1>
          <p className="dashboard-subtitle">Manage teammates, role assignments, and brand access using the same tables, pills, and card system as the rest of the app.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <button onClick={() => setInviteOpen(true)} className="btn-primary">+ Invite User</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "Total Users", value: loading ? "-" : users.length, color: "#5865f2" },
          { label: "Admins", value: loading ? "-" : users.filter(u => u.role === "AGENCY_ADMIN").length, color: "#dc2626" },
          { label: "Marketers", value: loading ? "-" : users.filter(u => u.role === "MARKETER").length, color: "#16a34a" },
          { label: "Brands", value: loading ? "-" : brands.length, color: "#d97706" },
        ].map(st => (
          <div key={st.label} className="dashboard-card" style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 8 }}>{st.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: st.color }}>{st.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={msg.startsWith("Error") ? "dashboard-banner-error" : "dashboard-card"} style={!msg.startsWith("Error") ? { padding: "14px 18px", color: "#16a34a" } : undefined}>
          {msg}
        </div>
      )}

      <div className="dashboard-card" style={{ padding: "16px 20px" }}>
        <div style={{ maxWidth: 340 }}>
          <input style={inp} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

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
                {["User", "Role", "Brands", "Member Since", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 800, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".12em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rc = ROLE_CFG[u.role];
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const initials = (u.name ?? u.email).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                const memberSince = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name ?? "—"}</div>
                          <div style={{ fontSize: 12, color: "var(--t3)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                        {u.role === "AGENCY_ADMIN" ? "Admin" : "Marketer"}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {u.brandMembers.length > 0 ? u.brandMembers.map(m => (
                          <span key={m.brand.id} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#f8fafc", color: "var(--t2)", fontWeight: 700, border: "1px solid var(--border)" }}>
                            {m.brand.name}
                          </span>
                        )) : <span style={{ fontSize: 12, color: "var(--t3)" }}>No brands</span>}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontSize: 13, color: "var(--t3)" }}>{memberSince}</td>
                    <td style={{ padding: "16px" }}>
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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Invite User" description="Add a new team member to the platform" onClose={() => setInviteOpen(false)} />
          <FormBody form={inviteForm} setForm={setInviteForm} isInvite />
          <DialogFooter>
            <button onClick={() => setInviteOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleInvite} disabled={saving || !inviteForm.name || !inviteForm.email || !inviteForm.password} style={{ ...btn, background: "#5865f2", color: "#fff", opacity: saving || !inviteForm.name || !inviteForm.email || !inviteForm.password ? 0.6 : 1 }}>
              {saving ? "Creating..." : "Create User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Edit User" description="Update team member details and access" onClose={() => setEditOpen(false)} />
          <FormBody form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleEdit} disabled={saving || !editForm.name} style={{ ...btn, background: "#5865f2", color: "#fff", opacity: saving || !editForm.name ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader icon={<span style={{ fontSize: 18 }}>!</span>} title="Remove User?" description="This user will lose access to all brands immediately." onClose={() => setDelId(null)} />
          <DialogFooter>
            <button onClick={() => setDelId(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} style={{ ...btn, background: "#dc2626", color: "#fff" }}>Remove</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
