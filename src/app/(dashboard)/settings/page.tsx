"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [currentPw, setCurrentPw]     = useState("");
  const [newPw, setNewPw]             = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg]   = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showLogout, setShowLogout]   = useState(false);

  const token = () => sessionStorage.getItem("access_token") ?? "";

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    const raw = sessionStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      setName(u.name || "");
      setEmail(u.email || "");
    }
    // Fetch fresh user data from DB
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
          sessionStorage.setItem("user", JSON.stringify(d.user));
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
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile");

      // Update sessionStorage
      const updated = { ...user, name: data.user.name, email: data.user.email };
      sessionStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setProfileMsg("success");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err: any) {
      setProfileMsg(`error:${err.message}`);
      setTimeout(() => setProfileMsg(""), 4000);
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    if (newPw !== confirmPw) { setPasswordMsg("error:Passwords do not match"); return; }
    if (newPw.length < 6)    { setPasswordMsg("error:Must be at least 6 characters"); return; }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password");

      setPasswordMsg("success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPasswordMsg(""), 3000);
    } catch (err: any) {
      setPasswordMsg(`error:${err.message}`);
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
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: "10px", color: "var(--t1)", fontSize: "14px",
    fontFamily: "inherit", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const labelSt: React.CSSProperties = { display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", marginBottom: "6px" };
  const cardSt  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "28px", marginBottom: "16px" };
  const focus   = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.12)"; };
  const blur    = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; };

  const profileIsError = profileMsg.startsWith("error:");
  const profileText    = profileMsg.replace("error:", "");
  const pwIsError      = passwordMsg.startsWith("error:");
  const pwMsg          = passwordMsg.replace("error:", "");

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="dashboard-page dashboard-page--narrow">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>

        {/* LEFT — Profile + Password */}
        <div>
          {/* Profile card */}
          <div style={cardSt}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "20px", flexShrink: 0 }}>
                {(user?.name || user?.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)" }}>Profile Information</h2>
                <p style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>Update your name and email</p>
              </div>
            </div>
            <form onSubmit={saveProfile}>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelSt}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelSt}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputSt} onFocus={focus} onBlur={blur} />
              </div>
              {profileText && (
                <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "9px", background: profileIsError ? "rgba(248,81,73,0.08)" : "rgba(63,185,80,0.08)", border: `1px solid ${profileIsError ? "rgba(248,81,73,0.25)" : "rgba(63,185,80,0.25)"}`, color: profileIsError ? "#f85149" : "#3fb950", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                  {!profileIsError && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {profileIsError ? profileText : "Profile updated successfully"}
                </div>
              )}
              <button type="submit" disabled={profileLoading}
                style={{ padding: "10px 22px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: profileLoading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(88,101,242,0.25)", opacity: profileLoading ? 0.7 : 1 }}>
                {profileLoading ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Password card */}
          <div style={{ ...cardSt, marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(88,101,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)" }}>Change Password</h2>
                <p style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>Keep your account secure</p>
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
                <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "9px", background: pwIsError ? "rgba(248,81,73,0.08)" : "rgba(63,185,80,0.08)", border: `1px solid ${pwIsError ? "rgba(248,81,73,0.25)" : "rgba(63,185,80,0.25)"}`, color: pwIsError ? "#f85149" : "#3fb950", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                  {!pwIsError && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {pwMsg}
                </div>
              )}
              <button type="submit" disabled={passwordLoading}
                style={{ padding: "10px 22px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: passwordLoading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(88,101,242,0.25)", opacity: passwordLoading ? 0.7 : 1 }}>
                {passwordLoading ? "Saving..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — Account + Sign Out */}
        <div>
          {/* Account info card */}
          <div style={cardSt}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", marginBottom: "20px" }}>Account</h2>
            {user && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "11px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "18px", flexShrink: 0 }}>
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>{user.name}</p>
                    <p style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>{user.email}</p>
                    <span style={{ display: "inline-block", marginTop: "6px", fontSize: "11px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px", background: "rgba(88,101,242,0.1)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)" }}>
                      {user.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Member since", value: memberSince },
                    { label: "Last login",   value: "Today"     },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "12px 14px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>{s.label}</p>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sign out card */}
          <div style={{ ...cardSt, marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(248,81,73,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f85149" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)" }}>Sign Out</h2>
                <p style={{ fontSize: "12px", color: "var(--t2)", marginTop: "2px" }}>End your current session</p>
              </div>
            </div>

            {!showLogout ? (
              <button onClick={() => setShowLogout(true)}
                style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid rgba(248,81,73,0.25)", background: "rgba(248,81,73,0.06)", color: "#f85149", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.06)"; }}>
                Sign Out
              </button>
            ) : (
              <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(248,81,73,0.05)", border: "1px solid rgba(248,81,73,0.2)" }}>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "14px", textAlign: "center" }}>Are you sure you want to sign out?</p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setShowLogout(false)}
                    style={{ flex: 1, padding: "9px", borderRadius: "9px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
                    Cancel
                  </button>
                  <button onClick={logout}
                    style={{ flex: 1, padding: "9px", borderRadius: "9px", border: "none", background: "#f85149", color: "white", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
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
