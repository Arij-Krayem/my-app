"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";

const HEALTH_CFG: Record<string, { color:string; bg:string; border:string; dot:string }> = {
  HEALTHY:  { color:"#16a34a", bg:"rgba(22,163,74,.08)",  border:"rgba(22,163,74,.2)",  dot:"#16a34a" },
  WARNING:  { color:"#d97706", bg:"rgba(217,119,6,.08)",  border:"rgba(217,119,6,.2)",  dot:"#d97706" },
  CRITICAL: { color:"#dc2626", bg:"rgba(220,38,38,.08)",  border:"rgba(220,38,38,.2)",  dot:"#dc2626" },
};

type Brand = { id:number; name:string; members:number; uploads:number; health:"HEALTHY"|"WARNING"|"CRITICAL"; roas:number; spend:string; lastActivity:string };

const MOCK: Brand[] = [
  { id:1, name:"TechCorp",   members:4, uploads:12, health:"HEALTHY",  roas:4.2, spend:"$24,500", lastActivity:"2h ago"  },
  { id:2, name:"RetailMax",  members:2, uploads:8,  health:"WARNING",  roas:1.8, spend:"$18,200", lastActivity:"1d ago"  },
  { id:3, name:"ServicePro", members:6, uploads:20, health:"CRITICAL", roas:1.4, spend:"$31,000", lastActivity:"3h ago"  },
  { id:4, name:"NovaBrand",  members:3, uploads:4,  health:"HEALTHY",  roas:3.9, spend:"$9,800",  lastActivity:"5d ago"  },
  { id:5, name:"ZenMedia",   members:4, uploads:9,  health:"WARNING",  roas:2.1, spend:"$15,600", lastActivity:"12h ago" },
];

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const inp: React.CSSProperties = {
  width:"100%", padding:"10px 12px", borderRadius:8,
  border:"1.5px solid #e2e8f0", background:"#f8fafc",
  fontSize:14, color:"#1e293b", outline:"none", boxSizing:"border-box",
};
const btn: React.CSSProperties = { padding:"9px 20px", borderRadius:9, border:"none", cursor:"pointer", fontWeight:600, fontSize:14 };

const AVATAR_COLORS = ["#5865f2","#16a34a","#dc2626","#d97706","#0ea5e9","#8b5cf6"];

export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>(MOCK);
  const [open, setOpen]     = useState(false);
  const [name, setName]     = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");

  const filtered = brands.filter(b =>
    (filter==="ALL" || b.health===filter) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      setBrands(p => [...p, { id:Date.now(), name:name.trim(), members:0, uploads:0, health:"HEALTHY", roas:0, spend:"$0", lastActivity:"Just now" }]);
      setSaving(false); setOpen(false); setName("");
      setMsg("Brand created successfully");
      setTimeout(() => setMsg(""), 2500);
    }, 600);
  }

  return (
    <div style={{ padding:32, fontFamily:"'Outfit',sans-serif", color:"#1e293b" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Brands</h1>
          <p style={{ color:"#64748b", fontSize:14, margin:"4px 0 0" }}>Manage all client workspaces and their performance</p>
        </div>
        <button onClick={() => setOpen(true)} style={{ ...btn, background:"linear-gradient(135deg,#5865f2,#818cf8)", color:"#fff" }}>
          + New Brand
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total",   value:brands.length,                                    color:"#5865f2" },
          { label:"Healthy", value:brands.filter(b=>b.health==="HEALTHY").length,     color:"#16a34a" },
          { label:"Warning", value:brands.filter(b=>b.health==="WARNING").length,     color:"#d97706" },
          { label:"Critical",value:brands.filter(b=>b.health==="CRITICAL").length,    color:"#dc2626" },
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

      {/* Search + Filters */}
      <div style={{ background:"#fff", border:"1px solid #e8edf2", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:14 }}>🔍</span>
            <input style={{ ...inp, paddingLeft:34 }} placeholder="Search brands…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["ALL","HEALTHY","WARNING","CRITICAL"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ ...btn, padding:"7px 14px", fontSize:13,
                  background: filter===f ? "#5865f2" : "#f1f5f9",
                  color: filter===f ? "#fff" : "#475569" }}>
                {f==="ALL" ? "All" : f.charAt(0)+f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"#fff", border:"1px solid #e8edf2", borderRadius:14, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"2px solid #f1f5f9", background:"#f8fafc" }}>
              {["Brand","Members","Uploads","Health","Spend","ROAS","Actions"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"12px 16px", fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => {
              const hc = HEALTH_CFG[b.health];
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <tr key={b.id} style={{ borderBottom:i<filtered.length-1?"1px solid #f1f5f9":"none", transition:"background .12s" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>
                        {b.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{b.name}</div>
                        <div style={{ fontSize:12, color:"#94a3b8" }}>Active {b.lastActivity}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 16px", color:"#64748b", fontSize:14 }}>{b.members}</td>
                  <td style={{ padding:"14px 16px", color:"#64748b", fontSize:14 }}>{b.uploads}</td>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:20, background:hc.bg, color:hc.color, border:`1px solid ${hc.border}`, fontSize:12, fontWeight:600 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:hc.dot }}/>
                      {b.health}
                    </span>
                  </td>
                  <td style={{ padding:"14px 16px", fontWeight:600, fontSize:14 }}>{b.spend}</td>
                  <td style={{ padding:"14px 16px", fontWeight:600, fontSize:14, color:b.roas>=2?"#16a34a":"#dc2626" }}>{b.roas.toFixed(1)}x</td>
                  <td style={{ padding:"14px 16px" }}>
                    <button onClick={() => router.push(`/brands/${b.id}`)}
                      style={{ ...btn, padding:"7px 16px", fontSize:13, background:"#f1f5f9", color:"#5865f2" }}>
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#94a3b8" }}>
            <div style={{ fontWeight:600, marginBottom:4 }}>No brands found</div>
            <div style={{ fontSize:13 }}>Try adjusting your search or filter</div>
          </div>
        )}
      </div>

      {/* ── New Brand Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth:420 }}>
          <DialogHeader
            icon={<BriefcaseIcon />}
            title="New Brand"
            description="Create a new client workspace"
            onClose={() => setOpen(false)}
          />
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8, display:"block" }}>Brand Name</label>
            <input style={inp} placeholder="e.g. TechCorp" value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleCreate()} autoFocus />
            <p style={{ fontSize:12, color:"#94a3b8", margin:"8px 0 0" }}>A new workspace will be created for this brand.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} style={{ ...btn, background:"#f1f5f9", color:"#475569" }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving||!name.trim()}
              style={{ ...btn, background:"linear-gradient(135deg,#5865f2,#818cf8)", color:"#fff", opacity:saving||!name.trim()?.6:1 }}>
              {saving ? "Creating…" : "Create Brand"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
