"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

type Role = "AGENCY_ADMIN"|"MARKETER";
type User = { id:number; name:string; email:string; role:Role; brands:string[]; createdAt:string; avatar:string };

const MOCK: User[] = [
  { id:1, name:"Sarah Johnson",  email:"sarah@visioad.com",  role:"AGENCY_ADMIN", brands:["TechCorp","RetailMax","ServicePro"], createdAt:"Jan 12, 2025", avatar:"SJ" },
  { id:2, name:"Marc Dupont",    email:"marc@visioad.com",   role:"MARKETER",     brands:["TechCorp"],                          createdAt:"Feb 3, 2025",  avatar:"MD" },
  { id:3, name:"Amira Benali",   email:"amira@visioad.com",  role:"MARKETER",     brands:["RetailMax","GrowthCo"],              createdAt:"Feb 18, 2025", avatar:"AB" },
  { id:4, name:"Tom Kristensen", email:"tom@visioad.com",    role:"MARKETER",     brands:["ServicePro"],                        createdAt:"Mar 1, 2025",  avatar:"TK" },
];

const ROLE_CFG: Record<Role,{color:string;bg:string;border:string}> = {
  AGENCY_ADMIN: { color:"#5865f2", bg:"rgba(88,101,242,.08)", border:"rgba(88,101,242,.2)" },
  MARKETER:     { color:"#d97706", bg:"rgba(217,119,6,.08)",  border:"rgba(217,119,6,.2)"  },
};

const AVATAR_COLORS = ["#5865f2","#16a34a","#dc2626","#d97706","#0ea5e9"];
const BRAND_OPTIONS = ["TechCorp","RetailMax","ServicePro","GrowthCo","NovaBrand"];

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const inp: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:8,
  border:"1.5px solid #e2e8f0", background:"#f8fafc",
  fontSize:14, color:"#1e293b", outline:"none", boxSizing:"border-box",
};
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };
const btn: React.CSSProperties = { padding:"9px 20px", borderRadius:9, border:"none", cursor:"pointer", fontWeight:600, fontSize:14 };
const lbl: React.CSSProperties = { fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:".06em", marginBottom:6, display:"block" };

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>(MOCK);
  const [search, setSearch]       = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [delId, setDelId]         = useState<number|null>(null);
  const [editUser, setEditUser]   = useState<User|null>(null);
  const [msg, setMsg]             = useState("");
  const [saving, setSaving]       = useState(false);

  const emptyForm = { name:"", email:"", role:"MARKETER" as Role, brands:[] as string[] };
  const [inviteForm, setInviteForm] = useState(emptyForm);
  const [editForm, setEditForm]   = useState(emptyForm);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ name:u.name, email:u.email, role:u.role, brands:[...u.brands] });
    setEditOpen(true);
  }

  function handleInvite() {
    if (!inviteForm.name || !inviteForm.email) return;
    setSaving(true);
    setTimeout(() => {
      const av = inviteForm.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
      setUsers(p => [...p, { id:Date.now(), ...inviteForm, createdAt:"Just now", avatar:av }]);
      setSaving(false); setInviteOpen(false); setInviteForm(emptyForm);
      setMsg("User invited successfully"); setTimeout(()=>setMsg(""),2500);
    }, 600);
  }

  function handleEdit() {
    if (!editUser) return;
    setSaving(true);
    setTimeout(() => {
      setUsers(p => p.map(u => u.id===editUser.id ? { ...u, ...editForm } : u));
      setSaving(false); setEditOpen(false);
      setMsg("User updated"); setTimeout(()=>setMsg(""),2500);
    }, 600);
  }

  function handleDelete() {
    setUsers(p => p.filter(u => u.id!==delId));
    setDelId(null); setMsg("User removed"); setTimeout(()=>setMsg(""),2500);
  }

  function toggleBrand(brand: string, form: typeof emptyForm, setForm: (f: typeof emptyForm) => void) {
    setForm({ ...form, brands: form.brands.includes(brand) ? form.brands.filter(b=>b!==brand) : [...form.brands, brand] });
  }

  const BrandPills = ({ form, setForm }: { form: typeof emptyForm; setForm: (f: typeof emptyForm)=>void }) => (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
      {BRAND_OPTIONS.map(b => (
        <div key={b} onClick={() => toggleBrand(b, form, setForm)}
          style={{ padding:"6px 14px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:500, transition:"all .15s",
            border: form.brands.includes(b) ? "1.5px solid #5865f2" : "1.5px solid #e2e8f0",
            background: form.brands.includes(b) ? "rgba(88,101,242,.08)" : "#f8fafc",
            color: form.brands.includes(b) ? "#5865f2" : "#64748b" }}>
          {b}
        </div>
      ))}
    </div>
  );

  const FormBody = ({ form, setForm }: { form: typeof emptyForm; setForm: (f: typeof emptyForm)=>void }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={lbl}>Full Name</label>
          <input style={inp} placeholder="Jane Doe" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        </div>
        <div>
          <label style={lbl}>Email</label>
          <input style={inp} type="email" placeholder="jane@co.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        </div>
      </div>
      <div>
        <label style={lbl}>Role</label>
        <select style={sel} value={form.role} onChange={e=>setForm({...form,role:e.target.value as Role})}>
          <option value="MARKETER">Marketer</option>
          <option value="AGENCY_ADMIN">Agency Admin</option>
        </select>
      </div>
      <div>
        <label style={lbl}>Assign Brands</label>
        <BrandPills form={form} setForm={setForm} />
      </div>
    </div>
  );

  return (
    <div style={{ padding:32, fontFamily:"'Outfit',sans-serif", color:"#1e293b" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Users</h1>
          <p style={{ color:"#64748b", fontSize:14, margin:"4px 0 0" }}>Manage team members and their brand access</p>
        </div>
        <button onClick={()=>setInviteOpen(true)} style={{ ...btn, background:"linear-gradient(135deg,#5865f2,#818cf8)", color:"#fff" }}>
          + Invite User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Users", value:users.length,                                    color:"#5865f2" },
          { label:"Admins",      value:users.filter(u=>u.role==="AGENCY_ADMIN").length,  color:"#dc2626" },
          { label:"Marketers",   value:users.filter(u=>u.role==="MARKETER").length,      color:"#16a34a" },
          { label:"Brands",      value:BRAND_OPTIONS.length,                             color:"#d97706" },
        ].map(st => (
          <div key={st.label} style={{ background:"#fff", border:"1px solid #e8edf2", borderRadius:14, padding:"18px 22px" }}>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>{st.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:st.color }}>{st.value}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ background:"rgba(22,163,74,.08)", border:"1px solid rgba(22,163,74,.25)", borderRadius:9, padding:"10px 16px", marginBottom:16, color:"#16a34a", fontSize:14 }}>
          ✓ {msg}
        </div>
      )}

      {/* Search */}
      <div style={{ background:"#fff", border:"1px solid #e8edf2", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ position:"relative", maxWidth:320 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:14 }}>🔍</span>
          <input style={{ ...inp, paddingLeft:34 }} placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", border:"1px solid #e8edf2", borderRadius:14, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #f1f5f9", background:"#f8fafc" }}>
              {["User","Role","Brands","Member Since",""].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"12px 16px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const rc = ROLE_CFG[u.role];
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <tr key={u.id} style={{ borderBottom:i<filtered.length-1?"1px solid #f1f5f9":"none", transition:"background .12s" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {u.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{u.name}</div>
                        <div style={{ fontSize:12, color:"#94a3b8" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>
                      {u.role==="AGENCY_ADMIN" ? "Admin" : "Marketer"}
                    </span>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {u.brands.map(b => (
                        <span key={b} style={{ fontSize:11, padding:"3px 8px", borderRadius:6, background:"#f1f5f9", color:"#475569", fontWeight:500 }}>{b}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:"14px 16px", fontSize:13, color:"#94a3b8" }}>{u.createdAt}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => openEdit(u)} style={{ ...btn, padding:"7px 14px", fontSize:13, background:"#f1f5f9", color:"#475569" }}>Edit</button>
                      <button onClick={() => setDelId(u.id)} style={{ ...btn, padding:"7px 14px", fontSize:13, background:"rgba(220,38,38,.08)", color:"#dc2626" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Invite User" description="Add a new team member to the platform" onClose={()=>setInviteOpen(false)} />
          <FormBody form={inviteForm} setForm={setInviteForm} />
          <DialogFooter>
            <button onClick={()=>setInviteOpen(false)} style={{ ...btn, background:"#f1f5f9", color:"#475569" }}>Cancel</button>
            <button onClick={handleInvite} disabled={saving||!inviteForm.name||!inviteForm.email}
              style={{ ...btn, background:"linear-gradient(135deg,#5865f2,#818cf8)", color:"#fff", opacity:saving||!inviteForm.name||!inviteForm.email?.6:1 }}>
              {saving ? "Sending…" : "Send Invite"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader icon={<UserIcon />} title="Edit User" description="Update team member details and access" onClose={()=>setEditOpen(false)} />
          <FormBody form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <button onClick={()=>setEditOpen(false)} style={{ ...btn, background:"#f1f5f9", color:"#475569" }}>Cancel</button>
            <button onClick={handleEdit} disabled={saving||!editForm.name||!editForm.email}
              style={{ ...btn, background:"linear-gradient(135deg,#5865f2,#818cf8)", color:"#fff", opacity:saving||!editForm.name||!editForm.email?.6:1 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={delId!==null} onOpenChange={()=>setDelId(null)}>
        <DialogContent style={{ maxWidth:400 }}>
          <DialogHeader icon={<span style={{ fontSize:18 }}>⚠️</span>} title="Remove User?" description="This user will lose access to all brands immediately." onClose={()=>setDelId(null)} />
          <DialogFooter>
            <button onClick={()=>setDelId(null)} style={{ ...btn, background:"#f1f5f9", color:"#475569" }}>Cancel</button>
            <button onClick={handleDelete} style={{ ...btn, background:"#dc2626", color:"#fff" }}>Remove</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}