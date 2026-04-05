"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  cardStyle,
  emptyIconWrapStyle,
  emptyStateWrapStyle,
  emptySubtitleStyle,
  emptyTitleStyle,
  metricCardStyle,
  pageEyebrowStyle,
  pageSubtitleStyle,
  pageTitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  subtleInputStyle,
  tableCellStyle,
  tableHeaderRowStyle,
  tableHeadingStyle,
  pillStyle,
} from "@/components/dashboard/designSystem";

type Role = "AGENCY_ADMIN" | "MARKETER";

interface Brand {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  brandMembers: { brand: Brand }[];
}

const ROLE_CFG: Record<Role, { color: string; bg: string; border: string }> = {
  AGENCY_ADMIN: { color: "#4f46e5", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.22)" },
  MARKETER: { color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)" },
};

const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9"];

const emptyForm = { name: "", email: "", password: "", role: "MARKETER" as Role, brandIds: [] as string[] };

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = users.filter(
    (user) =>
      (user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

  function openEdit(user: User) {
    setEditUser(user);
    setEditForm({
      name: user.name ?? "",
      email: user.email,
      password: "",
      role: user.role,
      brandIds: user.brandMembers.map((member) => member.brand.id),
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setMsg(`Error: ${message}`);
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(false);
    }
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setMsg(`Error: ${message}`);
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(false);
    }
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed";
      setMsg(`Error: ${message}`);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  function toggleBrand(brandId: string, form: typeof emptyForm, setForm: (value: typeof emptyForm) => void) {
    setForm({
      ...form,
      brandIds: form.brandIds.includes(brandId)
        ? form.brandIds.filter((value) => value !== brandId)
        : [...form.brandIds, brandId],
    });
  }

  const brandPills = (form: typeof emptyForm, setForm: (value: typeof emptyForm) => void) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {brands.map((brand) => {
        const active = form.brandIds.includes(brand.id);
        return (
          <button
            key={brand.id}
            type="button"
            onClick={() => toggleBrand(brand.id, form, setForm)}
            style={active ? primaryButtonStyle : secondaryButtonStyle}
          >
            {brand.name}
          </button>
        );
      })}
    </div>
  );

  const formBody = (form: typeof emptyForm, setForm: (value: typeof emptyForm) => void, isInvite?: boolean) => (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input style={subtleInputStyle} placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input style={subtleInputStyle} type="email" placeholder="Email" value={form.email} disabled={!isInvite} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </div>
      {isInvite && (
        <input style={subtleInputStyle} type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      )}
      <select style={subtleInputStyle} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
        <option value="MARKETER">Marketer</option>
        <option value="AGENCY_ADMIN">Agency Admin</option>
      </select>
      {brandPills(form, setForm)}
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={pageEyebrowStyle}>Users</div>
          <h1 style={pageTitleStyle}>Team access</h1>
          <p style={pageSubtitleStyle}>Manage teammates, role assignments, and brand access using the same tables, pills, and card system as the rest of the app.</p>
        </div>
        <button type="button" onClick={() => setInviteOpen(true)} style={primaryButtonStyle}>
          + Invite User
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Users", value: loading ? "--" : users.length, color: "#4f46e5" },
          { label: "Admins", value: loading ? "--" : users.filter((user) => user.role === "AGENCY_ADMIN").length, color: "#dc2626" },
          { label: "Marketers", value: loading ? "--" : users.filter((user) => user.role === "MARKETER").length, color: "#16a34a" },
          { label: "Brands", value: loading ? "--" : brands.length, color: "#d97706" },
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
        <input style={{ ...subtleInputStyle, maxWidth: 320 }} placeholder="Search users..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading ? (
          <div style={emptyStateWrapStyle}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.12)", borderTopColor: "#6366F1", animation: "spin 0.8s linear infinite" }} />
            <p style={{ ...emptySubtitleStyle, marginTop: 18 }}>Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={emptyStateWrapStyle}>
            <div style={emptyIconWrapStyle}>
              <UserIcon />
            </div>
            <h2 style={emptyTitleStyle}>No users found</h2>
            <p style={emptySubtitleStyle}>Invite a teammate or adjust the current search query.</p>
            <button type="button" onClick={() => setInviteOpen(true)} style={{ ...primaryButtonStyle, marginTop: 20 }}>
              Invite a teammate
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  {["User", "Role", "Brands", "Member Since", "Actions"].map((heading) => (
                    <th key={heading} style={tableHeadingStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, index) => {
                  const role = ROLE_CFG[user.role];
                  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const initials = (user.name ?? user.email)
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={user.id}
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
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: avatarColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600 }}>{user.name ?? "--"}</div>
                            <div style={{ color: "#94a3b8", fontSize: 12 }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={pillStyle(role.color, role.bg, role.border)}>{user.role === "AGENCY_ADMIN" ? "Admin" : "Marketer"}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {user.brandMembers.length > 0
                            ? user.brandMembers.map((member) => (
                                <span key={member.brand.id} style={pillStyle("#475569", "#f8fafc", "rgba(148,163,184,0.2)")}>
                                  {member.brand.name}
                                </span>
                              ))
                            : "No brands"}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{memberSince}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" onClick={() => openEdit(user)} style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDelId(user.id)}
                            style={{
                              ...secondaryButtonStyle,
                              padding: "8px 12px",
                              fontSize: 12,
                              borderColor: "rgba(239,68,68,0.2)",
                              background: "rgba(239,68,68,0.08)",
                              color: "#dc2626",
                            }}
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
          </div>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Invite User" description="Add a new team member to the platform" onClose={() => setInviteOpen(false)} />
          {formBody(inviteForm, setInviteForm, true)}
          <DialogFooter>
            <button type="button" onClick={() => setInviteOpen(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleInvite()} disabled={saving || !inviteForm.name || !inviteForm.email || !inviteForm.password} style={{ ...primaryButtonStyle, opacity: saving || !inviteForm.name || !inviteForm.email || !inviteForm.password ? 0.65 : 1 }}>
              {saving ? "Creating..." : "Create User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Edit User" description="Update team member details and access" onClose={() => setEditOpen(false)} />
          {formBody(editForm, setEditForm)}
          <DialogFooter>
            <button type="button" onClick={() => setEditOpen(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleEdit()} disabled={saving || !editForm.name} style={{ ...primaryButtonStyle, opacity: saving || !editForm.name ? 0.65 : 1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={delId !== null} onOpenChange={() => setDelId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader icon={<UserIcon />} title="Remove User?" description="This user will lose access to all brands immediately." onClose={() => setDelId(null)} />
          <DialogFooter>
            <button type="button" onClick={() => setDelId(null)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleDelete()} style={{ ...primaryButtonStyle, background: "#dc2626", boxShadow: "none" }}>
              Remove
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
