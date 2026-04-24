"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUploadField from "@/components/AvatarUploadField";
import UserAvatar from "@/components/UserAvatar";
import { readSessionUser, writeSessionUser } from "@/lib/session-user";

interface SettingsUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt?: string;
  avatarUrl?: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    const u = readSessionUser();
    if (u) {
      setUser(u);
      setName(u.name || "");
      setEmail(u.email || "");
      setAvatarUrl(u.avatarUrl ?? null);
    }
    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token()}` },
      credentials: "include",
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setUser(d.user);
          setName(d.user.name || "");
          setEmail(d.user.email || "");
          setAvatarUrl(d.user.avatarUrl ?? null);
          writeSessionUser(d.user);
        }
      })
      .catch(() => {});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name, email, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile");

      const updated = { ...user, name: data.user.name, email: data.user.email, avatarUrl: data.user.avatarUrl ?? null } as SettingsUser;
      writeSessionUser(updated);
      setUser(updated);
      setAvatarUrl(updated.avatarUrl ?? null);
      setProfileMsg("success");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setProfileMsg(`error:${message}`);
      setTimeout(() => setProfileMsg(""), 4000);
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    if (newPw !== confirmPw) { setPasswordMsg("error:Passwords do not match"); return; }
    if (newPw.length < 6) { setPasswordMsg("error:Must be at least 6 characters"); return; }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password");

      setPasswordMsg("success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPasswordMsg(""), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
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

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "11px 14px",
    background: "#fff", border: "1px solid var(--border)",
    borderRadius: "12px", color: "var(--t1)", fontSize: "14px",
    fontFamily: "inherit", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelSt: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: "700", color: "var(--t2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: ".12em" };
  const cardSt = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px" };
  const focus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.12)"; };
  const blur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; };

  const profileIsError = profileMsg.startsWith("error:");
  const profileText = profileMsg.replace("error:", "");
  const pwIsError = passwordMsg.startsWith("error:");
  const pwMsg = passwordMsg.replace("error:", "");

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">SETTINGS</div>
          <h1 className="dashboard-title">Account settings</h1>
          <p className="dashboard-subtitle">Manage your profile details, update your password, and control your current account session.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        <div>
          <div style={{ ...cardSt, marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <UserAvatar name={user?.name} email={user?.email} avatarUrl={avatarUrl} size={48} borderRadius={12} fontSize={20} />
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--t1)" }}>Profile information</h2>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginTop: "2px" }}>Update your display name and account email.</p>
              </div>
            </div>
            <form onSubmit={saveProfile}>
              <div style={{ marginBottom: "16px" }}>
                <AvatarUploadField
                  currentUrl={avatarUrl}
                  name={name || user?.name}
                  email={email || user?.email}
                  onUploaded={setAvatarUrl}
                  onRemove={() => setAvatarUrl(null)}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelSt}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelSt}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              {profileText && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "12px", background: profileIsError ? "rgba(248,81,73,0.08)" : "rgba(63,185,80,0.08)", border: `1px solid ${profileIsError ? "rgba(248,81,73,0.25)" : "rgba(63,185,80,0.25)"}`, color: profileIsError ? "#f85149" : "#3fb950", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  {!profileIsError && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {profileIsError ? profileText : "Profile updated successfully"}
                </div>
              )}
              <button type="submit" disabled={profileLoading} className="btn-primary" style={{ opacity: profileLoading ? 0.7 : 1 }}>
                {profileLoading ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </div>

          <div style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(88,101,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--t1)" }}>Change password</h2>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginTop: "2px" }}>Keep your account secure with a fresh password.</p>
              </div>
            </div>
            <form onSubmit={savePassword}>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelSt}>Current Password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelSt}>New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelSt}>Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6} style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              {pwMsg && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "12px", background: pwIsError ? "rgba(248,81,73,0.08)" : "rgba(63,185,80,0.08)", border: `1px solid ${pwIsError ? "rgba(248,81,73,0.25)" : "rgba(63,185,80,0.25)"}`, color: pwIsError ? "#f85149" : "#3fb950", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  {!pwIsError && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {pwMsg}
                </div>
              )}
              <button type="submit" disabled={passwordLoading} className="btn-primary" style={{ opacity: passwordLoading ? 0.7 : 1 }}>
                {passwordLoading ? "Saving..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div style={{ ...cardSt, marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--t1)", marginBottom: "20px" }}>Account</h2>
            {user && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "12px", background: "#f8fafc", border: "1px solid var(--border)", marginBottom: "16px" }}>
                  <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size={44} borderRadius={12} fontSize={18} />
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: "800", color: "var(--t1)" }}>{user.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>{user.email}</p>
                    <span style={{ display: "inline-block", marginTop: "6px", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "999px", background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)" }}>
                      {user.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Member since", value: memberSince },
                    { label: "Last login", value: "Today" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "12px 14px", borderRadius: "12px", background: "#f8fafc", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>{s.label}</p>
                      <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(248,81,73,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f85149" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--t1)" }}>Sign out</h2>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginTop: "2px" }}>End your current session safely.</p>
              </div>
            </div>

            {!showLogout ? (
              <button onClick={() => setShowLogout(true)} className="btn-secondary" style={{ width: "100%", color: "#f85149", borderColor: "rgba(248,81,73,0.25)", background: "rgba(248,81,73,0.06)" }}>
                Sign Out
              </button>
            ) : (
              <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(248,81,73,0.05)", border: "1px solid rgba(248,81,73,0.2)" }}>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "14px", textAlign: "center" }}>Are you sure you want to sign out?</p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setShowLogout(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button onClick={logout} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "none", background: "#f85149", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                    Yes, sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
