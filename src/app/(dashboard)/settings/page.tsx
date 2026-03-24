"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ModalOverlay from "@/components/ui/ModalOverlay";
import SectionHeader from "@/components/ui/SectionHeader";
import { avatarStyle, badgeStyle, btnDanger, btnPrimary, btnSecondary, cardStyle, inputStyle, labelStyle } from "@/lib/styles";

type SettingsSection = "account" | "password" | "profile";

interface SessionUser {
  email: string;
  name: string;
  role: string;
}

interface PasswordMessage {
  text: string;
  type: "error" | "success";
}

const SETTINGS_NAV: Array<{ desc: string; id: SettingsSection; icon: React.ReactElement; label: string }> = [
  {
    id: "profile",
    label: "Profile",
    desc: "Name & email",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "password",
    label: "Security",
    desc: "Password & 2FA",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Account",
    desc: "Role & details",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
];

const sectionTitles: Record<SettingsSection, { subtitle: string; title: string }> = {
  profile: { title: "Profile Information", subtitle: "Update your display name and email address." },
  password: { title: "Change Password", subtitle: "Keep your account secure with a strong password." },
  account: { title: "Account Details", subtitle: "Your role and membership information." },
};

export default function SettingsPage(): React.ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") return null;
    const rawUser = sessionStorage.getItem("user");
    return rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
  });
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    const rawUser = sessionStorage.getItem("user");
    return rawUser ? ((JSON.parse(rawUser) as SessionUser).name || "") : "";
  });
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    const rawUser = sessionStorage.getItem("user");
    return rawUser ? ((JSON.parse(rawUser) as SessionUser).email || "") : "";
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<"error" | "success" | "">("");
  const [passwordMessage, setPasswordMessage] = useState<PasswordMessage | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [isCompact, setIsCompact] = useState(false);
  const [isMedium, setIsMedium] = useState(false);

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");

    const syncViewport = (): void => {
      setIsCompact(window.innerWidth < 980);
      setIsMedium(window.innerWidth < 1200);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const saveProfile = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const updatedUser = { ...user, name, email } as SessionUser;
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setProfileMessage("success");
    window.setTimeout(() => setProfileMessage(""), 3000);
    setLoading(false);
  };

  const savePassword = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Must be at least 6 characters" });
      return;
    }

    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({ type: "success", text: "Password updated successfully" });
    window.setTimeout(() => setPasswordMessage(null), 3000);
    setLoading(false);
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore and clear the local session below.
    }

    sessionStorage.clear();
    router.push("/login");
  };

  const accountCards = useMemo(
    () => [
      { label: "Full Name", value: user?.name || "-", icon: "User" },
      { label: "Email", value: user?.email || "-", icon: "Mail" },
      { label: "Role", value: user?.role?.replace("_", " ") || "-", icon: "Role" },
      { label: "Member Since", value: "January 2024", icon: "Since" },
      { label: "Last Login", value: "Today", icon: "Login" },
      { label: "Status", value: "Active", icon: "Status" },
    ],
    [user],
  );

  const sectionProgress = useMemo(() => {
    if (activeSection === "profile") return name && email ? "Profile ready" : "Profile incomplete";
    if (activeSection === "password") return "Security check";
    return "Account snapshot";
  }, [activeSection, email, name]);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          ...cardStyle,
          marginBottom: "24px",
          padding: "22px 24px",
          display: "grid",
          gridTemplateColumns: isMedium ? "1fr" : "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
          gap: "16px",
          background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,247,255,0.96) 100%)",
        }}
      >
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Account Workspace
          </p>
          <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--t1)", marginBottom: "8px", letterSpacing: "-0.03em" }}>
            Manage your profile, security, and account details from one place.
          </p>
          <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.6, maxWidth: "620px" }}>
            The page is organized into focused sections so your details, password settings, and account information stay easy to find and update.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
          <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(88,101,242,0.08)", border: "1px solid rgba(88,101,242,0.18)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Current section</p>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--t1)", marginBottom: "4px" }}>{SETTINGS_NAV.find((item) => item.id === activeSection)?.label}</p>
            <p style={{ fontSize: "12px", color: "var(--t2)" }}>{sectionProgress}</p>
          </div>
          <div style={{ padding: "16px", borderRadius: "14px", background: "var(--bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Signed in as</p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)", marginBottom: "4px", wordBreak: "break-word" }}>{user?.email || "-"}</p>
            <p style={{ fontSize: "12px", color: "#5865f2", fontWeight: 600 }}>{user?.role?.replace("_", " ") || "User"}</p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "300px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...cardStyle,
            position: isCompact ? "relative" : "sticky",
            top: isCompact ? "auto" : "92px",
            overflow: "hidden",
            background: "#fbfcff",
          }}
        >
          <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ ...avatarStyle, width: "60px", height: "60px", borderRadius: "16px", background: "linear-gradient(135deg,#5865f2,#818cf8)", fontSize: "24px", fontWeight: 800, marginBottom: "14px", boxShadow: "0 8px 20px rgba(88,101,242,0.3)" }}>
              {(user?.name || user?.email || "?")[0]?.toUpperCase()}
            </div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "#1a1d2e", marginBottom: "3px" }}>{user?.name || "-"}</p>
            <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px", wordBreak: "break-all" }}>{user?.email || "-"}</p>
            <span style={{ ...badgeStyle, background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {user?.role?.replace("_", " ") || "User"}
            </span>
          </div>

          <nav style={{ padding: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase", padding: "0 12px", marginBottom: "8px", marginTop: "4px" }}>Navigation</p>
            {SETTINGS_NAV.map((item) => {
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "11px 14px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    background: active ? "rgba(88,101,242,0.08)" : "transparent",
                    color: active ? "#5865f2" : "#4b5563",
                    marginBottom: "2px",
                    textAlign: "left",
                    borderLeft: active ? "3px solid #5865f2" : "3px solid transparent",
                  }}
                >
                  <div style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: active ? 700 : 500 }}>{item.label}</div>
                    <div style={{ fontSize: "11px", color: active ? "rgba(88,101,242,0.7)" : "#9ca3af" }}>{item.desc}</div>
                  </div>
                  {active ? <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#5865f2" }} /> : null}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => setShowLogout(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 14px",
                borderRadius: "12px",
                border: "none",
                background: "transparent",
                color: "#f85149",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle, overflow: "hidden", minHeight: "calc(100vh - 260px)" }}>
          <div style={{ padding: "28px 32px 22px", borderBottom: "1px solid var(--border)", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <SectionHeader title={sectionTitles[activeSection].title} subtitle={sectionTitles[activeSection].subtitle} />
              <div style={{ minWidth: "220px", padding: "14px 16px", borderRadius: "14px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Quick note</p>
                <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.5 }}>
                  {activeSection === "profile"
                    ? "Keep your contact details current so account ownership stays clear."
                    : activeSection === "password"
                      ? "Use a unique password and update it regularly for better protection."
                      : "This section is read-only and summarizes your current membership data."}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: "32px", flex: 1 }}>
            {activeSection === "profile" ? (
              <form onSubmit={(event) => void saveProfile(event)} style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "minmax(0, 1.2fr) minmax(260px, 0.8fr)", gap: "20px", alignItems: "start" }}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input value={name} onChange={(event) => setName(event.target.value)} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={inputStyle} />
                    </div>
                  </div>

                  {profileMessage ? (
                    <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "10px", background: profileMessage === "success" ? "rgba(63,185,80,0.07)" : "rgba(248,81,73,0.07)", border: `1px solid ${profileMessage === "success" ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)"}`, color: profileMessage === "success" ? "#3fb950" : "#f85149", fontSize: "13px" }}>
                      {profileMessage === "success" ? "Profile updated successfully" : "Something went wrong, please try again"}
                    </div>
                  ) : null}

                  <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Saving..." : "Update Profile"}
                  </button>
                </div>

                <div style={{ ...cardStyle, padding: "24px", background: "#fbfcff" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Profile checklist</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      { done: Boolean(name), label: "Display name is filled in" },
                      { done: Boolean(email), label: "Email address is available" },
                      { done: Boolean(user?.role), label: "Role is assigned" },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", background: item.done ? "rgba(63,185,80,0.12)" : "rgba(148,163,184,0.14)", color: item.done ? "#3fb950" : "var(--t3)", border: `1px solid ${item.done ? "rgba(63,185,80,0.25)" : "var(--border)"}` }}>
                          {item.done ? "✓" : "•"}
                        </div>
                        <span style={{ fontSize: "13px", color: "var(--t2)" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            ) : null}

            {activeSection === "password" ? (
              <form onSubmit={(event) => void savePassword(event)} style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "minmax(0, 1.1fr) minmax(260px, 0.9fr)", gap: "20px", alignItems: "start" }}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  {[
                    { label: "Current Password", value: currentPassword, onChange: setCurrentPassword, minLength: 1 },
                    { label: "New Password", value: newPassword, onChange: setNewPassword, minLength: 6 },
                    { label: "Confirm Password", value: confirmPassword, onChange: setConfirmPassword, minLength: 6 },
                  ].map((field) => (
                    <div key={field.label} style={{ marginBottom: "20px" }}>
                      <label style={labelStyle}>{field.label}</label>
                      <input type="password" value={field.value} onChange={(event) => field.onChange(event.target.value)} required minLength={field.minLength} style={inputStyle} />
                    </div>
                  ))}

                  {passwordMessage ? (
                    <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "10px", background: passwordMessage.type === "success" ? "rgba(63,185,80,0.07)" : "rgba(248,81,73,0.07)", border: `1px solid ${passwordMessage.type === "success" ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)"}`, color: passwordMessage.type === "success" ? "#3fb950" : "#f85149", fontSize: "13px" }}>
                      {passwordMessage.text}
                    </div>
                  ) : null}

                  <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Saving..." : "Change Password"}
                  </button>
                </div>

                <div style={{ ...cardStyle, padding: "24px", background: "#fbfcff" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Security tips</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      "Use at least 6 characters.",
                      "Avoid reusing passwords across tools.",
                      "Confirm the new password carefully before saving.",
                    ].map((item) => (
                      <div key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#5865f2", marginTop: "6px", flexShrink: 0 }} />
                        <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.5 }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            ) : null}

            {activeSection === "account" ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : isMedium ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
                  {accountCards.map((card) => (
                    <div key={card.label} style={{ padding: "18px 16px", borderRadius: "12px", background: "#f8f9ff", border: "1px solid #e8ebf5" }}>
                      <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>{card.icon}</div>
                      <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>{card.label}</p>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1d2e", wordBreak: "break-all" }}>{card.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ ...cardStyle, marginTop: "20px", padding: "22px 24px", background: "#fbfcff" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Account status</p>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)", marginBottom: "6px" }}>Your account is active and ready to use.</p>
                  <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.6 }}>
                    This area is intentionally read-only so key role and membership details stay consistent across the workspace.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showLogout ? (
        <ModalOverlay onClose={() => setShowLogout(false)} maxWidth={360}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f85149", margin: "0 auto 18px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1d2e", marginBottom: "8px" }}>Sign out?</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "28px", lineHeight: 1.6 }}>You&apos;ll be redirected to the login page and will need to sign in again.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowLogout(false)} style={{ ...btnSecondary, flex: 1 }}>
                Cancel
              </button>
              <button onClick={() => void logout()} style={{ ...btnDanger, flex: 1 }}>
                Sign Out
              </button>
            </div>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}
