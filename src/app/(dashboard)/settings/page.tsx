"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUploadField from "@/components/AvatarUploadField";
import UserAvatar from "@/components/UserAvatar";
import { readSessionUser, writeSessionUser } from "@/lib/session-user";
import styles from "./page.module.css";

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

      <div className={styles.settingsGrid}>
        <div>
          <div className={`${styles.card} ${styles.spacedCard}`}>
            <div className={styles.sectionHeader}>
              <UserAvatar name={user?.name} email={user?.email} avatarUrl={avatarUrl} size={48} borderRadius={12} fontSize={20} />
              <div>
                <h2 className={styles.title}>Profile information</h2>
                <p className={styles.subtitle}>Update your display name and account email.</p>
              </div>
            </div>
            <form onSubmit={saveProfile}>
              <div className={styles.fieldLarge}>
                <AvatarUploadField
                  currentUrl={avatarUrl}
                  name={name || user?.name}
                  email={email || user?.email}
                  onUploaded={setAvatarUrl}
                  onRemove={() => setAvatarUrl(null)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className={styles.input} />
              </div>
              <div className={styles.fieldLast}>
                <label className={styles.label}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={styles.input} />
              </div>
              {profileText && (
                <div className={`${styles.message} ${profileIsError ? styles.messageError : styles.messageSuccess}`}>
                  {!profileIsError && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {profileIsError ? profileText : "Profile updated successfully"}
                </div>
              )}
              <button type="submit" disabled={profileLoading} className={`btn-primary ${profileLoading ? styles.buttonLoading : ""}`}>
                {profileLoading ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.iconBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <h2 className={styles.title}>Change password</h2>
                <p className={styles.subtitle}>Keep your account secure with a fresh password.</p>
              </div>
            </div>
            <form onSubmit={savePassword}>
              <div className={styles.field}>
                <label className={styles.label}>Current Password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required className={styles.input} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>New Password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} className={styles.input} />
              </div>
              <div className={styles.fieldLast}>
                <label className={styles.label}>Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6} className={styles.input} />
              </div>
              {pwMsg && (
                <div className={`${styles.message} ${pwIsError ? styles.messageError : styles.messageSuccess}`}>
                  {!pwIsError && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {pwMsg}
                </div>
              )}
              <button type="submit" disabled={passwordLoading} className={`btn-primary ${passwordLoading ? styles.buttonLoading : ""}`}>
                {passwordLoading ? "Saving..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className={`${styles.card} ${styles.spacedCard}`}>
            <h2 className={styles.accountTitle}>Account</h2>
            {user && (
              <div>
                <div className={styles.accountBox}>
                  <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size={44} borderRadius={12} fontSize={18} />
                  <div>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userEmail}>{user.email}</p>
                    <span className={styles.roleBadge}>
                      {user.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  {[
                    { label: "Member since", value: memberSince },
                    { label: "Last login", value: "Today" },
                  ].map(s => (
                    <div key={s.label} className={styles.statCard}>
                      <p className={styles.statLabel}>{s.label}</p>
                      <p className={styles.statValue}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.sectionHeaderCompact}>
              <div className={styles.dangerIconBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div>
                <h2 className={styles.title}>Sign out</h2>
                <p className={styles.subtitle}>End your current session safely.</p>
              </div>
            </div>

            {!showLogout ? (
              <button onClick={() => setShowLogout(true)} className={`btn-secondary ${styles.signOutButton}`}>
                Sign Out
              </button>
            ) : (
              <div className={styles.confirmBox}>
                <p className={styles.confirmText}>Are you sure you want to sign out?</p>
                <div className={styles.confirmActions}>
                  <button onClick={() => setShowLogout(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={logout} className={styles.dangerButton}>
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
