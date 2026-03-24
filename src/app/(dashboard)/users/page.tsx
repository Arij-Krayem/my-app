"use client";

import { useMemo, useState } from "react";

import EmptyState from "@/components/ui/EmptyState";
import StatBadge from "@/components/ui/StatBadge";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { AVATAR_COLORS, BRAND_OPTIONS } from "@/lib/constants";
import {
  avatarStyle,
  badgeStyle,
  btnDanger,
  btnPrimary,
  btnSecondary,
  cardStyle,
  inputStyle,
  labelStyle,
  tableHeaderStyle,
  tableRowStyle,
} from "@/lib/styles";

type Role = "AGENCY_ADMIN" | "MARKETER";

interface UserRecord {
  avatar: string;
  brands: string[];
  createdAt: string;
  email: string;
  id: number;
  name: string;
  role: Role;
}

interface UserFormState {
  brands: string[];
  email: string;
  name: string;
  role: Role;
}

const MOCK_USERS: UserRecord[] = [
  { id: 1, name: "Sarah Johnson", email: "sarah@visioad.com", role: "AGENCY_ADMIN", brands: ["TechCorp", "RetailMax", "ServicePro"], createdAt: "Jan 12, 2025", avatar: "SJ" },
  { id: 2, name: "Marc Dupont", email: "marc@visioad.com", role: "MARKETER", brands: ["TechCorp"], createdAt: "Feb 3, 2025", avatar: "MD" },
  { id: 3, name: "Amira Benali", email: "amira@visioad.com", role: "MARKETER", brands: ["RetailMax", "GrowthCo"], createdAt: "Feb 18, 2025", avatar: "AB" },
  { id: 4, name: "Tom Kristensen", email: "tom@visioad.com", role: "MARKETER", brands: ["ServicePro"], createdAt: "Mar 1, 2025", avatar: "TK" },
];

const ROLE_CONFIG: Record<Role, { bg: string; border: string; color: string; label: string }> = {
  AGENCY_ADMIN: { color: "#5865f2", bg: "rgba(88,101,242,.08)", border: "rgba(88,101,242,.2)", label: "Admin" },
  MARKETER: { color: "#d97706", bg: "rgba(217,119,6,.08)", border: "rgba(217,119,6,.2)", label: "Marketer" },
};

const emptyForm: UserFormState = { name: "", email: "", role: "MARKETER", brands: [] };

function UserIcon(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface BrandPillsProps {
  form: UserFormState;
  onChange: (next: UserFormState) => void;
}

function BrandPills({ form, onChange }: BrandPillsProps): React.ReactElement {
  const toggleBrand = (brand: string): void => {
    onChange({
      ...form,
      brands: form.brands.includes(brand)
        ? form.brands.filter((value) => value !== brand)
        : [...form.brands, brand],
    });
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {BRAND_OPTIONS.map((brand) => {
        const active = form.brands.includes(brand);

        return (
          <button
            key={brand}
            type="button"
            onClick={() => toggleBrand(brand)}
            style={{
              ...btnSecondary,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              background: active ? "rgba(88,101,242,.08)" : "var(--bg)",
              color: active ? "#5865f2" : "var(--t2)",
              border: active ? "1.5px solid #5865f2" : "1.5px solid var(--border)",
            }}
          >
            {brand}
          </button>
        );
      })}
    </div>
  );
}

interface UserFormProps {
  form: UserFormState;
  onChange: (next: UserFormState) => void;
}

function UserForm({ form, onChange }: UserFormProps): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            style={inputStyle}
            placeholder="Jane Doe"
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
          />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="jane@co.com"
            value={form.email}
            onChange={(event) => onChange({ ...form, email: event.target.value })}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Role</label>
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={form.role}
          onChange={(event) => onChange({ ...form, role: event.target.value as Role })}
        >
          <option value="MARKETER">Marketer</option>
          <option value="AGENCY_ADMIN">Agency Admin</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Assign Brands</label>
        <BrandPills form={form} onChange={onChange} />
      </div>
    </div>
  );
}

export default function UsersPage(): React.ReactElement {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState<UserFormState>(emptyForm);
  const [editForm, setEditForm] = useState<UserFormState>(emptyForm);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, users],
  );

  const openEdit = (user: UserRecord): void => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, brands: [...user.brands] });
    setEditOpen(true);
  };

  const withToast = (text: string): void => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const handleInvite = (): void => {
    if (!inviteForm.name || !inviteForm.email) return;
    setSaving(true);
    window.setTimeout(() => {
      const avatar = inviteForm.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setUsers((current) => [...current, { id: Date.now(), ...inviteForm, createdAt: "Just now", avatar }]);
      setSaving(false);
      setInviteOpen(false);
      setInviteForm(emptyForm);
      withToast("User invited successfully");
    }, 600);
  };

  const handleEdit = (): void => {
    if (!editUser) return;
    setSaving(true);
    window.setTimeout(() => {
      setUsers((current) => current.map((user) => (user.id === editUser.id ? { ...user, ...editForm } : user)));
      setSaving(false);
      setEditOpen(false);
      withToast("User updated");
    }, 600);
  };

  const handleDelete = (): void => {
    setUsers((current) => current.filter((user) => user.id !== deleteId));
    setDeleteId(null);
    withToast("User removed");
  };

  const stats = [
    { label: "Total Users", count: users.length, color: "#5865f2", bg: "rgba(88,101,242,.08)", border: "rgba(88,101,242,.2)" },
    { label: "Admins", count: users.filter((user) => user.role === "AGENCY_ADMIN").length, color: "#dc2626", bg: "rgba(220,38,38,.08)", border: "rgba(220,38,38,.2)" },
    { label: "Marketers", count: users.filter((user) => user.role === "MARKETER").length, color: "#16a34a", bg: "rgba(22,163,74,.08)", border: "rgba(22,163,74,.2)" },
    { label: "Brands", count: BRAND_OPTIONS.length, color: "#d97706", bg: "rgba(217,119,6,.08)", border: "rgba(217,119,6,.2)" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={() => setInviteOpen(true)} style={btnPrimary}>
          + Invite User
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {stats.map((stat) => (
          <StatBadge key={stat.label} count={stat.count} label={stat.label} color={stat.color} bg={stat.bg} border={stat.border} />
        ))}
      </div>

      {message ? (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 16px",
            borderRadius: 10,
            background: "rgba(22,163,74,.08)",
            border: "1px solid rgba(22,163,74,.25)",
            color: "#16a34a",
            fontSize: 14,
          }}
        >
          {message}
        </div>
      ) : null}

      <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ position: "relative", maxWidth: 320 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--t3)",
              display: "flex",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            style={{ ...inputStyle, paddingLeft: 34 }}
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9", background: "var(--bg)" }}>
              {["User", "Role", "Brands", "Member Since", ""].map((header) => (
                <th key={header} style={tableHeaderStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => {
                const roleConfig = ROLE_CONFIG[user.role];
                const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

                return (
                  <tr
                    key={user.id}
                    style={{
                      ...tableRowStyle,
                      borderBottom: index < filteredUsers.length - 1 ? "1px solid #f1f5f9" : "none",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ ...avatarStyle, background: color }}>{user.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: "var(--t3)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ ...badgeStyle, background: roleConfig.bg, color: roleConfig.color, border: `1px solid ${roleConfig.border}` }}>
                        {roleConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {user.brands.map((brand) => (
                          <span
                            key={brand}
                            style={{
                              fontSize: 11,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#f1f5f9",
                              color: "#475569",
                              fontWeight: 500,
                            }}
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--t3)" }}>{user.createdAt}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(user)} style={{ ...btnSecondary, padding: "7px 14px", fontSize: 13 }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteId(user.id)} style={{ ...btnDanger, padding: "7px 14px", fontSize: 13 }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: 20 }}>
                  <EmptyState
                    title="No users found"
                    subtitle="Try adjusting your search to find a team member."
                    icon={
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Invite User" description="Add a new team member to the platform" onClose={() => setInviteOpen(false)} />
          <UserForm form={inviteForm} onChange={setInviteForm} />
          <DialogFooter>
            <button onClick={() => setInviteOpen(false)} style={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={saving || !inviteForm.name || !inviteForm.email}
              style={{ ...btnPrimary, opacity: saving || !inviteForm.name || !inviteForm.email ? 0.6 : 1 }}
            >
              {saving ? "Sending..." : "Send Invite"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Edit User" description="Update team member details and access" onClose={() => setEditOpen(false)} />
          <UserForm form={editForm} onChange={setEditForm} />
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} style={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={saving || !editForm.name || !editForm.email}
              style={{ ...btnPrimary, opacity: saving || !editForm.name || !editForm.email ? 0.6 : 1 }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent style={{ maxWidth: 400 }}>
          <DialogHeader
            icon={<span style={{ fontSize: 18 }}>!</span>}
            title="Remove User?"
            description="This user will lose access to all brands immediately."
            onClose={() => setDeleteId(null)}
          />
          <DialogFooter>
            <button onClick={() => setDeleteId(null)} style={btnSecondary}>
              Cancel
            </button>
            <button onClick={handleDelete} style={btnDanger}>
              Remove
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
