"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser]             = useState<any>(null);
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [profileMsg, setProfileMsg] = useState<"success"|"error"|"">("");
  const [pwMsg, setPwMsg]           = useState<{type:"success"|"error";text:string}|null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [activeSection, setSection] = useState<"profile"|"password"|"account">("profile");

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    const raw = sessionStorage.getItem("user");
    if (raw) { const u = JSON.parse(raw); setUser(u); setName(u.name||""); setEmail(u.email||""); }
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const updated = { ...user, name, email };
    sessionStorage.setItem("user", JSON.stringify(updated));
    setUser(updated); setProfileMsg("success");
    setTimeout(() => setProfileMsg(""), 3000);
    setLoading(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type:"error", text:"Passwords do not match" }); return; }
    if (newPw.length < 6) { setPwMsg({ type:"error", text:"Must be at least 6 characters" }); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwMsg({ type:"success", text:"Password updated successfully" });
    setTimeout(() => setPwMsg(null), 3000);
    setLoading(false);
  };

  const logout = async () => {
    try { await fetch("/api/auth/logout", { method:"POST", credentials:"include" }); } catch {}
    sessionStorage.clear(); router.push("/login");
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"11px 14px", background:"#f8f9ff",
    border:"1px solid #e2e5f0", borderRadius:"10px", color:"#1a1d2e",
    fontSize:"14px", fontFamily:"inherit", outline:"none",
    transition:"border-color 0.2s, box-shadow 0.2s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor="#5865f2"; e.target.style.boxShadow="0 0 0 3px rgba(88,101,242,0.12)"; e.target.style.background="white";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor="#e2e5f0"; e.target.style.boxShadow="none"; e.target.style.background="#f8f9ff";
  };

  const NAV = [
    { id:"profile",  label:"Profile",  desc:"Name & email",
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id:"password", label:"Security", desc:"Password & 2FA",
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { id:"account",  label:"Account",  desc:"Role & details",
      icon:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
  ] as const;

  const sectionTitles: Record<string,{title:string;sub:string}> = {
    profile:  { title:"Profile Information",   sub:"Update your display name and email address" },
    password: { title:"Change Password",       sub:"Keep your account secure with a strong password" },
    account:  { title:"Account Details",       sub:"Your role and membership information" },
  };

  return (
    <div style={{ animation:"fadeUp 0.4s ease both", fontFamily:"'Outfit', sans-serif", height:"100%", display:"flex", flexDirection:"column" }}>

      {/* Page header */}
      <div style={{ marginBottom:"28px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:"700", color:"var(--t1)", marginBottom:"4px" }}>Settings</h1>
        <p style={{ fontSize:"14px", color:"var(--t2)" }}>Manage your account settings and preferences</p>
      </div>

      {/* Full layout: left sidebar + right content, fills page */}
      <div style={{ flex:1, display:"flex", gap:"0", background:"var(--card)", border:"1px solid var(--border)", borderRadius:"18px", overflow:"hidden", minHeight:"calc(100vh - 220px)" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width:"280px", flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"#fafbff" }}>

          {/* Avatar block */}
          <div style={{ padding:"28px 24px 20px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"16px", background:"linear-gradient(135deg,#5865f2,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"800", fontSize:"24px", marginBottom:"14px", boxShadow:"0 8px 20px rgba(88,101,242,0.3)" }}>
              {(user?.name||user?.email||"?")[0].toUpperCase()}
            </div>
            <p style={{ fontSize:"16px", fontWeight:"700", color:"#1a1d2e", marginBottom:"3px" }}>{user?.name||"—"}</p>
            <p style={{ fontSize:"12px", color:"#6b7280", marginBottom:"10px", wordBreak:"break-all" }}>{user?.email||"—"}</p>
            <span style={{ fontSize:"10px", fontWeight:"700", padding:"3px 10px", borderRadius:"20px", background:"rgba(88,101,242,0.1)", color:"#5865f2", border:"1px solid rgba(88,101,242,0.2)", letterSpacing:"0.5px", textTransform:"uppercase" }}>
              {user?.role?.replace("_"," ")||"USER"}
            </span>
          </div>

          {/* Nav */}
          <nav style={{ padding:"12px", flex:1 }}>
            <p style={{ fontSize:"10px", fontWeight:"700", color:"#9ca3af", letterSpacing:"1px", textTransform:"uppercase", padding:"0 12px", marginBottom:"8px", marginTop:"4px" }}>Navigation</p>
            {NAV.map(n => {
              const active = activeSection === n.id;
              return (
                <button key={n.id} onClick={() => setSection(n.id)} style={{
                  width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px",
                  borderRadius:"12px", border:"none", cursor:"pointer", fontFamily:"inherit",
                  background:active?"rgba(88,101,242,0.08)":"transparent",
                  color:active?"#5865f2":"#4b5563",
                  marginBottom:"2px", textAlign:"left", transition:"all 0.15s",
                  borderLeft:active?"3px solid #5865f2":"3px solid transparent",
                }}>
                  <div style={{ opacity:active?1:0.6 }}>{n.icon}</div>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:active?"700":"500" }}>{n.label}</div>
                    <div style={{ fontSize:"11px", color:active?"rgba(88,101,242,0.7)":"#9ca3af" }}>{n.desc}</div>
                  </div>
                  {active && <div style={{ marginLeft:"auto", width:"6px", height:"6px", borderRadius:"50%", background:"#5865f2" }} />}
                </button>
              );
            })}
          </nav>

          {/* Sign out at bottom */}
          <div style={{ padding:"12px", borderTop:"1px solid var(--border)" }}>
            <button onClick={() => setShowLogout(true)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px",
              borderRadius:"12px", border:"none", background:"transparent", color:"#f85149",
              fontSize:"14px", fontWeight:"500", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", textAlign:"left",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(248,81,73,0.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent"; }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"auto" }}>

          {/* Section header */}
          <div style={{ padding:"28px 36px 24px", borderBottom:"1px solid var(--border)", background:"white" }}>
            <h2 style={{ fontSize:"19px", fontWeight:"700", color:"#1a1d2e", marginBottom:"3px" }}>{sectionTitles[activeSection].title}</h2>
            <p style={{ fontSize:"13px", color:"#6b7280" }}>{sectionTitles[activeSection].sub}</p>
          </div>

          <div style={{ padding:"36px", flex:1 }}>

            {/* ── PROFILE ── */}
            {activeSection === "profile" && (
              <form onSubmit={saveProfile} style={{ maxWidth:"600px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"24px" }}>
                  <div>
                    <label style={{ display:"block", fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"8px" }}>Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} required style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"8px" }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {profileMsg && (
                  <div style={{ marginBottom:"20px", padding:"12px 16px", borderRadius:"10px", background:profileMsg==="success"?"rgba(63,185,80,0.07)":"rgba(248,81,73,0.07)", border:`1px solid ${profileMsg==="success"?"rgba(63,185,80,0.3)":"rgba(248,81,73,0.3)"}`, color:profileMsg==="success"?"#3fb950":"#f85149", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}>
                    {profileMsg==="success"
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                    {profileMsg==="success"?"Profile updated successfully":"Something went wrong, please try again"}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#5865f2,#818cf8)", border:"none", borderRadius:"10px", color:"white", fontSize:"14px", fontWeight:"600", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(88,101,242,0.3)", opacity:loading?0.7:1, transition:"all 0.15s" }}>
                  {loading?"Saving…":"Update Profile"}
                </button>
              </form>
            )}

            {/* ── SECURITY ── */}
            {activeSection === "password" && (
              <form onSubmit={savePassword} style={{ maxWidth:"480px" }}>
                {[
                  { label:"Current Password", val:currentPw, setter:setCurrentPw },
                  { label:"New Password",     val:newPw,     setter:setNewPw     },
                  { label:"Confirm Password", val:confirmPw, setter:setConfirmPw },
                ].map((f, i) => (
                  <div key={f.label} style={{ marginBottom:"20px" }}>
                    <label style={{ display:"block", fontSize:"13px", fontWeight:"600", color:"#374151", marginBottom:"8px" }}>{f.label}</label>
                    <input type="password" value={f.val} onChange={e => f.setter(e.target.value)} required minLength={i===0?1:6} style={inp} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                ))}
                {pwMsg && (
                  <div style={{ marginBottom:"20px", padding:"12px 16px", borderRadius:"10px", background:pwMsg.type==="success"?"rgba(63,185,80,0.07)":"rgba(248,81,73,0.07)", border:`1px solid ${pwMsg.type==="success"?"rgba(63,185,80,0.3)":"rgba(248,81,73,0.3)"}`, color:pwMsg.type==="success"?"#3fb950":"#f85149", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}>
                    {pwMsg.type==="success"
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                    {pwMsg.text}
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#5865f2,#818cf8)", border:"none", borderRadius:"10px", color:"white", fontSize:"14px", fontWeight:"600", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(88,101,242,0.3)", opacity:loading?0.7:1 }}>
                  {loading?"Saving…":"Change Password"}
                </button>
              </form>
            )}

            {/* ── ACCOUNT ── */}
            {activeSection === "account" && (
              <div style={{ maxWidth:"640px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px", marginBottom:"28px" }}>
                  {[
                    { label:"Full Name",    value:user?.name||"—",                       icon:"👤" },
                    { label:"Email",        value:user?.email||"—",                      icon:"📧" },
                    { label:"Role",         value:user?.role?.replace("_"," ")||"—",     icon:"🔑" },
                    { label:"Member Since", value:"January 2024",                        icon:"📅" },
                    { label:"Last Login",   value:"Today",                               icon:"🕐" },
                    { label:"Status",       value:"Active",                              icon:"✅" },
                  ].map(f => (
                    <div key={f.label} style={{ padding:"18px 16px", borderRadius:"12px", background:"#f8f9ff", border:"1px solid #e8ebf5" }}>
                      <div style={{ fontSize:"18px", marginBottom:"8px" }}>{f.icon}</div>
                      <p style={{ fontSize:"10px", color:"#9ca3af", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"4px" }}>{f.label}</p>
                      <p style={{ fontSize:"14px", fontWeight:"600", color:"#1a1d2e", wordBreak:"break-all" }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sign out modal */}
      {showLogout && (
        <div style={{ position:"fixed", inset:0, zIndex:101, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ position:"relative", zIndex:101, background:"white", borderRadius:"20px", padding:"36px", maxWidth:"360px", width:"90%", boxShadow:"0 32px 80px rgba(0,0,0,0.2)", animation:"modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both", textAlign:"center" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"16px", background:"rgba(248,81,73,0.08)", border:"1px solid rgba(248,81,73,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#f85149", margin:"0 auto 18px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3 style={{ fontSize:"18px", fontWeight:"700", color:"#1a1d2e", marginBottom:"8px" }}>Sign out?</h3>
            <p style={{ fontSize:"13px", color:"#6b7280", marginBottom:"28px", lineHeight:1.6 }}>You'll be redirected to the login page and will need to sign in again.</p>
            <div style={{ display:"flex", gap:"10px" }}>
              <button style={{ flex:1, padding:"12px", borderRadius:"10px", border:"1px solid #e2e5f0", background:"transparent", color:"#6b7280", fontSize:"14px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              <button onClick={logout} style={{ flex:1, padding:"12px", borderRadius:"10px", border:"none", background:"#f85149", color:"white", fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(248,81,73,0.3)" }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}