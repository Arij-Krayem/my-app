"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type UserRecord = {
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
};

type SettingsSection = "profile" | "security" | "account";

const SECTION_META: Record<
  SettingsSection,
  { label: string; title: string; subtitle: string; helper: string }
> = {
  profile: {
    label: "Profile",
    title: "Profile Information",
    subtitle: "Name & email",
    helper:
      "Quick Note: Keep your profile details up to date so uploads, alerts, and account ownership stay clear across the workspace.",
  },
  security: {
    label: "Security",
    title: "Password & Access",
    subtitle: "Password & access",
    helper:
      "Quick Note: Use a strong password you do not reuse elsewhere. Updating it regularly helps protect workspace access.",
  },
  account: {
    label: "Account",
    title: "Role & Details",
    subtitle: "Role & details",
    helper:
      "Quick Note: Account details help teammates understand ownership and access level across the workspace.",
  },
};

const panelStyle: CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)",
  boxShadow: "var(--shadow-card)",
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "var(--text-muted)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "12px 14px",
  borderRadius: "var(--radius-input)",
  border: "1px solid var(--border)",
  background: "#fff",
  color: "var(--text-primary)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

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

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    const raw = sessionStorage.getItem("user");
    if (raw) {
      const storedUser = JSON.parse(raw) as UserRecord;
      setUser(storedUser);
      setName(storedUser.name || "");
      setEmail(storedUser.email || "");
    }

    apiFetch<{ user?: UserRecord }>("/api/users/me")
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch((fetchError) => {
        console.error("[settings] Failed to load profile", fetchError);
      });
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileMsg("");

    try {
      const data = await apiFetch<{ user: UserRecord }>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });

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
      await apiFetch("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });

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
      await apiFetch("/api/auth/logout", {
        method: "POST",
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
  const displayInitial = (displayName || displayEmail)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const messageStyle = (isError: boolean): CSSProperties => ({
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: "var(--radius-input)",
    border: isError ? "1px solid rgba(220,38,38,0.18)" : "1px solid rgba(22,163,74,0.18)",
    background: isError ? "rgba(220,38,38,0.06)" : "rgba(22,163,74,0.06)",
    color: isError ? "var(--critical)" : "var(--success)",
    fontSize: 13,
    fontWeight: 600,
  });

  const renderSectionBody = () => {
    if (activeSection === "profile") {
      return (
        <form onSubmit={saveProfile}>
          <div className="settings-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
            <div>
              <label style={fieldLabelStyle}>Full Name</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={fieldLabelStyle}>Email Address</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={inputStyle} />
            </div>
          </div>

          {profileText ? (
            <div style={messageStyle(profileIsError)}>
              {profileIsError ? profileText : "Profile updated successfully"}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={profileLoading}
            style={{
              marginTop: 18,
              minHeight: 44,
              padding: "0 18px",
              border: "none",
              borderRadius: "var(--radius-button)",
              background: "var(--primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: profileLoading ? "not-allowed" : "pointer",
              opacity: profileLoading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {profileLoading ? "Saving..." : "Update Profile"}
          </button>
        </form>
      );
    }

    if (activeSection === "security") {
      return (
        <form onSubmit={savePassword} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={fieldLabelStyle}>Current Password</label>
            <input type="password" value={currentPw} onChange={(event) => setCurrentPw(event.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>New Password</label>
            <input type="password" value={newPw} onChange={(event) => setNewPw(event.target.value)} required minLength={6} style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabelStyle}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={(event) => setConfirmPw(event.target.value)} required minLength={6} style={inputStyle} />
          </div>

          {passwordText ? (
            <div style={messageStyle(passwordIsError)}>
              {passwordIsError ? passwordText : "Password updated successfully"}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={passwordLoading}
            style={{
              minHeight: 44,
              width: "fit-content",
              padding: "0 18px",
              border: "none",
              borderRadius: "var(--radius-button)",
              background: "var(--primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: passwordLoading ? "not-allowed" : "pointer",
              opacity: passwordLoading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {passwordLoading ? "Saving..." : "Change Password"}
          </button>
        </form>
      );
    }

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div className="settings-two-col" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
          <div style={{ ...panelStyle, padding: 16, background: "#fafafa" }}>
            <div style={fieldLabelStyle}>Role</div>
            <div style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700 }}>{roleLabel}</div>
          </div>
          <div style={{ ...panelStyle, padding: 16, background: "#fafafa" }}>
            <div style={fieldLabelStyle}>Member Since</div>
            <div style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700 }}>{memberSince}</div>
          </div>
        </div>

        <div style={{ ...panelStyle, padding: 16, background: "#fafafa" }}>
          <div style={fieldLabelStyle}>Workspace Access</div>
          <Link href="/brands" style={{ color: "var(--text-accent)", fontSize: 14, fontWeight: 700 }}>
            Open workspace settings
          </Link>
        </div>

        <div style={{ ...panelStyle, padding: 18 }}>
          <div style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Sign Out</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            End the current session on this device when you are finished working.
          </div>
          {!showLogout ? (
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              style={{
                minHeight: 40,
                padding: "0 16px",
                borderRadius: "var(--radius-button)",
                border: "1px solid rgba(220,38,38,0.2)",
                background: "rgba(220,38,38,0.06)",
                color: "var(--critical)",
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
                borderRadius: "var(--radius-input)",
                border: "1px solid rgba(220,38,38,0.16)",
                background: "rgba(220,38,38,0.04)",
                padding: 14,
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
                Are you sure you want to sign out?
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowLogout(false)}
                  style={{
                    minHeight: 40,
                    padding: "0 14px",
                    borderRadius: "var(--radius-button)",
                    border: "1px solid var(--border)",
                    background: "#fff",
                    color: "var(--text-muted)",
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
                    minHeight: 40,
                    padding: "0 14px",
                    borderRadius: "var(--radius-button)",
                    border: "none",
                    background: "var(--critical)",
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
      </div>
    );
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <section className="settings-main-grid" style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <aside style={{ ...panelStyle, padding: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingBottom: 22, borderBottom: "1px solid var(--border)" }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, var(--primary), #8a8cf8)",
                color: "#fff",
                fontSize: 28,
                fontWeight: 800,
                marginBottom: 14,
              }}
            >
              {displayInitial}
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700 }}>{displayName}</div>
            <div style={{ marginTop: 6, color: "var(--text-muted)", fontSize: 14, wordBreak: "break-word" }}>{displayEmail}</div>
            <span
              style={{
                marginTop: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 30,
                padding: "0 12px",
                borderRadius: 999,
                background: "rgba(91,94,244,0.1)",
                color: "var(--text-accent)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
              }}
            >
              {roleLabel}
            </span>
          </div>

          <div style={{ paddingTop: 22 }}>
            <div style={{ ...fieldLabelStyle, marginBottom: 14 }}>Navigation</div>
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
                      minHeight: 58,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: active ? "1px solid rgba(91,94,244,0.18)" : "1px solid transparent",
                      background: active ? "rgba(91,94,244,0.08)" : "transparent",
                      color: active ? "var(--text-accent)" : "var(--text-primary)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ textAlign: "left" }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>{SECTION_META[section].label}</span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 12, color: active ? "var(--text-accent)" : "var(--text-muted)" }}>
                        {SECTION_META[section].subtitle}
                      </span>
                    </span>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: active ? "var(--primary)" : "transparent",
                        boxShadow: active ? "0 0 0 6px rgba(91,94,244,0.12)" : "none",
                        border: active ? "none" : "1px solid var(--border)",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div style={{ ...panelStyle, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...fieldLabelStyle, color: "var(--text-accent)", marginBottom: 10 }}>
              {SECTION_META[activeSection].label.toUpperCase()}
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: 28, fontWeight: 700, lineHeight: 1.15 }}>
              {SECTION_META[activeSection].title}
            </div>
          </div>

          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: "var(--radius-card)",
              background: "rgba(91,94,244,0.08)",
              border: "1px solid rgba(91,94,244,0.14)",
              color: "var(--text-accent)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {SECTION_META[activeSection].helper}
          </div>

          {renderSectionBody()}
        </div>

      </section>

      <style>{`
        @media (max-width: 1180px) {
          .settings-main-grid {
            grid-template-columns: 260px minmax(0, 1fr);
          }
        }

        @media (max-width: 980px) {
          .settings-hero-grid,
          .settings-main-grid,
          .settings-hero-cards,
          .settings-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
