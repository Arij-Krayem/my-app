"use client";

import type { CSSProperties } from "react";
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

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: Role;
  brandIds: string[];
};

const ROLE_CFG: Record<Role, { color: string; bg: string; border: string; label: string }> = {
  AGENCY_ADMIN: { color: "#5b5ef4", bg: "rgba(91,94,244,0.1)", border: "rgba(91,94,244,0.2)", label: "Agency Admin" },
  MARKETER: { color: "#d97706", bg: "rgba(217,119,6,0.1)", border: "rgba(217,119,6,0.2)", label: "Marketer" },
};

const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9"];

const emptyForm: UserForm = { name: "", email: "", password: "", role: "MARKETER", brandIds: [] };

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "var(--text-muted)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  );
}

function UserXIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
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
  const [inviteForm, setInviteForm] = useState<UserForm>(emptyForm);
  const [editForm, setEditForm] = useState<UserForm>(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, brandsData] = await Promise.all([
        apiFetch<{ items?: User[] }>("/api/users?pageSize=100"),
        apiFetch<{ items?: Brand[] }>("/api/brands"),
      ]);
      setUsers(usersData.items ?? []);
      setBrands(brandsData.items ?? []);
    } catch (fetchError) {
      console.error("[users] Failed to load users page data", fetchError);
      setMsg(`Error: ${fetchError instanceof Error ? fetchError.message : "Failed to load users"}`);
      setTimeout(() => setMsg(""), 3000);
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
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(inviteForm),
      });
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
      await apiFetch(`/api/users?id=${editUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editForm.name, role: editForm.role, brandIds: editForm.brandIds }),
      });
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
      await apiFetch(`/api/users?id=${delId}`, {
        method: "DELETE",
      });
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

  function toggleBrand(brandId: string, form: UserForm, setForm: React.Dispatch<React.SetStateAction<UserForm>>) {
    setForm((current) => ({
      ...current,
      brandIds: current.brandIds.includes(brandId)
        ? current.brandIds.filter((value) => value !== brandId)
        : [...current.brandIds, brandId],
    }));
  }

  function renderBrandPills(form: UserForm, setForm: React.Dispatch<React.SetStateAction<UserForm>>) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {brands.map((brand) => {
          const active = form.brandIds.includes(brand.id);
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => toggleBrand(brand.id, form, setForm)}
              style={{
                minHeight: 38,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${active ? "rgba(91,94,244,0.2)" : "var(--border)"}`,
                background: active ? "var(--primary)" : "#fff",
                color: active ? "#fff" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {brand.name}
            </button>
          );
        })}
      </div>
    );
  }

  function renderFormBody(form: UserForm, setForm: React.Dispatch<React.SetStateAction<UserForm>>, isInvite?: boolean) {
    return (
      <div style={{ display: "grid", gap: 16, padding: "20px 24px 0" }}>
        <div className="users-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={{ ...subtleInputStyle, minHeight: 46 }} placeholder="Full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input style={{ ...subtleInputStyle, minHeight: 46 }} type="email" placeholder="Email address" value={form.email} disabled={!isInvite} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </div>
        </div>

        {isInvite ? (
          <div>
            <label style={labelStyle}>Temporary Password</label>
            <input style={{ ...subtleInputStyle, minHeight: 46 }} type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </div>
        ) : null}

        <div>
          <label style={labelStyle}>Role</label>
          <select style={{ ...subtleInputStyle, minHeight: 46 }} value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}>
            <option value="AGENCY_ADMIN">Agency Admin</option>
            <option value="MARKETER">Marketer</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Brand Access</label>
          {renderBrandPills(form, setForm)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={pageEyebrowStyle}>Users</div>
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
                        <span style={pillStyle(role.color, role.bg, role.border)}>{role.label}</span>
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
        <DialogContent style={{ maxWidth: 560 }}>
          <DialogHeader icon={<UserPlusIcon />} title="Invite User" description="Send an invitation to join the workspace" onClose={() => setInviteOpen(false)} />
          {renderFormBody(inviteForm, setInviteForm, true)}
          <DialogFooter>
            <button type="button" onClick={() => setInviteOpen(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleInvite()} disabled={saving || !inviteForm.name || !inviteForm.email || !inviteForm.password} style={{ ...primaryButtonStyle, opacity: saving || !inviteForm.name || !inviteForm.email || !inviteForm.password ? 0.65 : 1 }}>
              {saving ? "Sending..." : "Send Invite"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent style={{ maxWidth: 560 }}>
          <DialogHeader icon={<UserIcon />} title="Edit User" description="Update team member details and access" onClose={() => setEditOpen(false)} />
          {renderFormBody(editForm, setEditForm)}
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
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader icon={<UserXIcon />} title="Remove User?" description="This user will lose access to all brands immediately." onClose={() => setDelId(null)} />
          <div style={{ padding: "18px 24px 0", color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
            This action removes the teammate from every assigned brand and revokes workspace access right away.
          </div>
          <DialogFooter style={{ paddingTop: 22 }}>
            <button type="button" onClick={() => setDelId(null)} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleDelete()} style={{ ...primaryButtonStyle, background: "var(--critical)", boxShadow: "none" }}>
              Remove
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 720px) {
          .users-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
