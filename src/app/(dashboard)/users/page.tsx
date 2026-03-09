"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MOCK_USERS = [
  { id: 1, name: "John Doe",     email: "john@example.com",  role: "MARKETER",     brands: ["TechCorp","RetailMax"], createdAt: "2024-01-15" },
  { id: 2, name: "Jane Smith",   email: "jane@example.com",  role: "MARKETER",     brands: ["TechCorp"],             createdAt: "2024-02-20" },
  { id: 3, name: "Bob Johnson",  email: "bob@example.com",   role: "AGENCY_ADMIN", brands: ["All Brands"],           createdAt: "2024-01-10" },
  { id: 4, name: "Alice Brown",  email: "alice@example.com", role: "MARKETER",     brands: ["ServicePro"],           createdAt: "2024-03-05" },
];

const ROLE_CFG: Record<string, { color: string; bg: string; border: string }> = {
  AGENCY_ADMIN: { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)"  },
  MARKETER:     { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers]       = useState(MOCK_USERS);
  const [showModal, setModal]   = useState(false);
  const [invEmail, setEmail]    = useState("");
  const [invRole, setRole]      = useState("MARKETER");
  const [invBrands, setBrands]  = useState<string[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (raw && JSON.parse(raw).role !== "AGENCY_ADMIN") router.push("/dashboard");
  }, [router]);

  const deleteUser = (id: number) => {
    if (confirm("Delete this user?")) setUsers(u => u.filter(x => x.id !== id));
  };

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invEmail.trim()) return;
    setUsers(u => [...u, { id: Date.now(), name: invEmail.split("@")[0], email: invEmail.trim(), role: invRole, brands: invRole === "AGENCY_ADMIN" ? ["All Brands"] : invBrands, createdAt: new Date().toISOString().split("T")[0] }]);
    setModal(false); setEmail(""); setRole("MARKETER"); setBrands([]);
  };

  const toggleBrand = (b: string) => setBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const inputSt = { padding: "9px 12px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "9px", color: "var(--t1)", fontSize: "14px", fontFamily: "inherit", outline: "none", width: "100%", transition: "border-color 0.2s" };
  const labelSt: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: "700", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Users</h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Manage user accounts and permissions</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.3)" }}>
          + Invite User
        </button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 110px 1.5fr 110px 100px", padding: "13px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
          {["Name","Email","Role","Brands","Created","Actions"].map(h => (
            <span key={h} style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ color: "var(--t3)", display: "flex", justifyContent: "center", marginBottom: "14px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>No users yet</p>
            <p style={{ fontSize: "13px", color: "var(--t2)" }}>Invite your first team member to get started</p>
          </div>
        ) : (
          users.map((u, i) => {
            const rc = ROLE_CFG[u.role] ?? ROLE_CFG.MARKETER;
            return (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 110px 1.5fr 110px 100px", padding: "15px 24px", alignItems: "center", gap: "8px", borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.02)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "13px" }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{u.name}</span>
                </div>
                <span style={{ fontSize: "13px", color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, display: "inline-block" }}>
                  {u.role === "AGENCY_ADMIN" ? "ADMIN" : "MARKETER"}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {u.brands.map(b => (
                    <span key={b} style={{ fontSize: "11px", fontWeight: "500", padding: "2px 8px", borderRadius: "5px", background: "rgba(88,101,242,0.08)", color: "#5865f2", border: "1px solid rgba(88,101,242,0.2)" }}>{b}</span>
                  ))}
                </div>
                <span style={{ fontSize: "13px", color: "var(--t2)" }}>{u.createdAt}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ fontSize: "12px", fontWeight: "600", color: "#5865f2", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Edit</button>
                  <button onClick={() => deleteUser(u.id)} style={{ fontSize: "12px", fontWeight: "600", color: "#f85149", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,20,40,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 60px rgba(0,0,0,0.15)", animation: "fadeUp 0.25s ease both", margin: "0 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)" }}>Invite New User</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "var(--t3)", fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>
            <form onSubmit={invite}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelSt}>Email Address</label>
                <input type="email" value={invEmail} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" required style={inputSt}
                  onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelSt}>Role</label>
                <select value={invRole} onChange={e => setRole(e.target.value)} style={inputSt}>
                  <option value="MARKETER">Marketer</option>
                  <option value="AGENCY_ADMIN">Agency Admin</option>
                </select>
              </div>
              {invRole === "MARKETER" && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelSt}>Assign Brands</label>
                  {["TechCorp","RetailMax","ServicePro"].map(b => (
                    <label key={b} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", cursor: "pointer" }}>
                      <div onClick={() => toggleBrand(b)} style={{ width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${invBrands.includes(b) ? "#5865f2" : "var(--border)"}`, background: invBrands.includes(b) ? "#5865f2" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }}>
                        {invBrands.includes(b) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ fontSize: "14px", color: "var(--t1)" }}>{b}</span>
                    </label>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.3)" }}>Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}