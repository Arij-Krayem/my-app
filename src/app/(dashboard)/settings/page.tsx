"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserRecord = {
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
};

type SettingsSection = "profile" | "security" | "account";

const SECTION_META: Record<
  SettingsSection,
  { label: string; title: string; subtitle: string }
> = {
  profile: {
    label: "Profile",
    title: "Profile Information",
    subtitle: "Name & email",
  },
  security: {
    label: "Security",
    title: "Password & Access",
    subtitle: "Password & access",
  },
  account: {
    label: "Account",
    title: "Role & Details",
    subtitle: "Role & details",
  },
};

const baseCardStyle: CSSProperties = {
  background: "#fff",
  border: "0.5px solid rgba(148,163,184,0.32)",
  borderRadius: 12,
  padding: 20,
};

function InfoTile({
  label,
  value,
  hint,
  linkLabel,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  linkLabel?: string;
  href?: string;
}) {
  return (
    <div style={{ ...baseCardStyle, padding: 18 }}>
      <div
        style={{
          color: "#6366F1",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>{value}</div>
      <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>{hint}</div>
      {linkLabel ? (
        <div style={{ marginTop: 10 }}>
          <Link
            href={href ?? "/brands"}
            style={{
              color: "#4f46e5",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {linkLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function CheckItem({ text, done }: { text: string; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: done ? "#0f172a" : "#64748b", fontSize: 14 }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: done ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.12)",
          color: done ? "#16a34a" : "#94a3b8",
          border: done ? "1px solid rgba(34,197,94,0.18)" : "1px solid rgba(148,163,184,0.16)",
          flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {text}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [user, setUser] = useState<UserRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showLogout, setShowLogout] = useState(false);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    const raw = sessionStorage.getItem("user");
    if (raw) {
      const storedUser = JSON.parse(raw) as UserRecord;
      setUser(storedUser);
      setName(storedUser.name || "");
      setEmail(storedUser.email || "");
    }

    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token()}` },
      credentials: "include",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch(() => {});
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileMsg("");

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update profile");
      }

      const updatedUser = { ...user, name: data.user.name, email: data.user.email };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileMsg("success");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      setProfileMsg(`error:${message}`);
      setTimeout(() => setProfileMsg(""), 4000);
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMsg("");

    if (newPw !== confirmPw) {
      setPasswordMsg("error:Passwords do not match");
      return;
    }

    if (newPw.length < 6) {
      setPasswordMsg("error:Must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/users/me/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to change password");
      }

      setPasswordMsg("success");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPasswordMsg(""), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      setPasswordMsg(`error:${message}`);
      setTimeout(() => setPasswordMsg(""), 4000);
    } finally {
      setPasswordLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
    } catch {}

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  const profileIsError = profileMsg.startsWith("error:");
  const passwordIsError = passwordMsg.startsWith("error:");
  const profileText = profileMsg.replace("error:", "");
  const passwordText = passwordMsg.replace("error:", "");

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Mar 2026";

  const roleLabel = (user?.role || "AGENCY_ADMIN").replace("_", " ");
  const displayName = name || user?.name || "Agency Admin";
  const displayEmail = email || user?.email || "admin@visioad.com";
  const displayInitial = (displayName || displayEmail)[0]?.toUpperCase() ?? "A";

  const checklist = useMemo(
    () => [
      { text: "Display name is filled in", done: Boolean(name.trim()) },
      { text: "Email address is available", done: Boolean(email.trim()) },
      { text: "Role is assigned", done: Boolean(user?.role) },
    ],
    [email, name, user?.role],
  );

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.32)",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    marginBottom: 7,
    color: "#475569",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.02em",
  };

  const formMessageStyle = (isError: boolean): CSSProperties => ({
    marginBottom: 16,
    padding: "12px 14px",
    borderRadius: 10,
    border: isError
      ? "1px solid rgba(239,68,68,0.24)"
      : "1px solid rgba(34,197,94,0.2)",
    background: isError ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)",
    color: isError ? "#dc2626" : "#15803d",
    fontSize: 13,
    fontWeight: 600,
  });

  const renderSectionPanel = () => {
    if (activeSection === "profile") {
      return (
        <>
          <div
            style={{
              marginBottom: 18,
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.12)",
              color: "#5b61d6",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Quick Note: Keep your profile details up to date so uploads, alerts, and account ownership stay clear across the workspace.
          </div>

          <form onSubmit={saveProfile}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {profileText ? (
              <div style={formMessageStyle(profileIsError)}>
                {profileIsError ? profileText : "Profile updated successfully"}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                marginTop: 18,
                padding: "11px 18px",
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg,#5865f2,#7c83ff)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: profileLoading ? "not-allowed" : "pointer",
                opacity: profileLoading ? 0.72 : 1,
                boxShadow: "0 12px 22px rgba(88,101,242,0.18)",
              }}
            >
              {profileLoading ? "Saving..." : "Update Profile"}
            </button>
          </form>
        </>
      );
    }

    if (activeSection === "security") {
      return (
        <>
          <div
            style={{
              marginBottom: 18,
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.12)",
              color: "#5b61d6",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Quick Note: Use a strong password you do not reuse elsewhere. Updating it regularly helps protect workspace access.
          </div>

          <form onSubmit={savePassword}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelStyle}>Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(event) => setCurrentPw(event.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(event) => setNewPw(event.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(event) => setConfirmPw(event.target.value)}
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>
            </div>

            {passwordText ? (
              <div style={{ ...formMessageStyle(passwordIsError), marginTop: 16, marginBottom: 0 }}>
                {passwordIsError ? passwordText : "Password updated successfully"}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                marginTop: 18,
                padding: "11px 18px",
                border: "none",
                borderRadius: 12,
                background: "linear-gradient(135deg,#5865f2,#7c83ff)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: passwordLoading ? "not-allowed" : "pointer",
                opacity: passwordLoading ? 0.72 : 1,
                boxShadow: "0 12px 22px rgba(88,101,242,0.18)",
              }}
            >
              {passwordLoading ? "Saving..." : "Change Password"}
            </button>
          </form>
        </>
      );
    }

    return (
      <>
        <div
          style={{
            marginBottom: 18,
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.12)",
            color: "#5b61d6",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Quick Note: Account details help teammates understand ownership and access level across the workspace.
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ ...baseCardStyle, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Role
            </div>
            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>{roleLabel}</div>
          </div>
          <div style={{ ...baseCardStyle, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Member Since
            </div>
            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>{memberSince}</div>
          </div>
          <div style={{ ...baseCardStyle, padding: 16, background: "#f8fafc" }}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              Workspace Access
            </div>
            <Link
              href="/brands"
              style={{ color: "#4f46e5", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              Open workspace settings
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 18, ...baseCardStyle }}>
          <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            Sign Out
          </div>
          <div style={{ color: "#64748b", fontSize: 13, marginBottom: 14 }}>
            End the current session on this device when you are finished working.
          </div>
          {!showLogout ? (
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.24)",
                background: "rgba(239,68,68,0.08)",
                color: "#dc2626",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign Out
            </button>
          ) : (
            <div
              style={{
                borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.18)",
                background: "rgba(239,68,68,0.05)",
                padding: 14,
              }}
            >
              <div style={{ color: "#475569", fontSize: 13, marginBottom: 12 }}>
                Are you sure you want to sign out?
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowLogout(false)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.32)",
                    background: "#fff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Yes, sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <section
        style={{
          marginBottom: 22,
          borderRadius: 18,
          padding: 24,
          background: "linear-gradient(135deg,#f8f9ff 0%, #ffffff 55%, #f4f6ff 100%)",
          border: "0.5px solid rgba(148,163,184,0.22)",
          boxShadow: "0 16px 40px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                color: "#6366F1",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Settings
            </div>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: 32, fontWeight: 700 }}>
              Manage your workspace profile
            </h1>
            <p style={{ marginTop: 10, color: "#64748b", fontSize: 15, maxWidth: 540, lineHeight: 1.6 }}>
              Keep personal details, account access, and workspace context organized from one cleaner control panel.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <InfoTile
              label="Current Section"
              value={`${SECTION_META[activeSection].label} - ${activeSection === "profile" ? "Profile ready" : activeSection === "security" ? "Access secured" : "Details active"}`}
              hint={SECTION_META[activeSection].title}
            />
            <InfoTile
              label="Role"
              value={roleLabel}
              hint="Workspace access available"
              linkLabel="Workspace access"
              href="/brands"
            />
            <InfoTile
              label="Member Since"
              value={memberSince}
              hint="Account active"
            />
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <aside style={{ display: "grid", gap: 16 }}>
          <div style={baseCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg,#5865f2,#8b93ff)",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: 800,
                  boxShadow: "0 14px 24px rgba(88,101,242,0.2)",
                  flexShrink: 0,
                }}
              >
                {displayInitial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#0f172a",
                    fontSize: 18,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    color: "#64748b",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayEmail}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    marginTop: 10,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(99,102,241,0.1)",
                    color: "#4f46e5",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <div style={baseCardStyle}>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
              Navigation
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {(Object.keys(SECTION_META) as SettingsSection[]).map((section) => {
                const active = activeSection === section;
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => setActiveSection(section)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      width: "100%",
                      border: "none",
                      borderRadius: 999,
                      background: active ? "rgba(99,102,241,0.1)" : "transparent",
                      color: active ? "#4338ca" : "#334155",
                      padding: "12px 14px",
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ textAlign: "left" }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>
                        {SECTION_META[section].label}
                      </span>
                      <span style={{ display: "block", marginTop: 2, fontSize: 12, color: active ? "#5b61d6" : "#94a3b8" }}>
                        {SECTION_META[section].subtitle}
                      </span>
                    </span>
                    {active ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#6366F1",
                          boxShadow: "0 0 0 6px rgba(99,102,241,0.12)",
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.75fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div style={baseCardStyle}>
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  {SECTION_META[activeSection].label}
                </div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22, fontWeight: 700 }}>
                  {SECTION_META[activeSection].title}
                </h2>
              </div>
              {renderSectionPanel()}
            </div>

            <div style={baseCardStyle}>
              <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Profile Checklist
              </div>
              <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                A quick readiness view for the core account details used across the workspace.
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {checklist.map((item) => (
                  <CheckItem key={item.text} text={item.text} done={item.done} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
