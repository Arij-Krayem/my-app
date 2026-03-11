"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const BRANDS_DATA: Record<string, any> = {
  "1": { id:1, name:"TechCorp",   health:"HEALTHY",  members:5, uploads:12, metrics:{ totalSpend:45230, roas:3.8, ctr:2.9, cpc:1.45 }, members_list:[{ id:1,name:"John Doe",email:"john@techcorp.com",role:"MARKETER" },{ id:2,name:"Jane Smith",email:"jane@techcorp.com",role:"MARKETER" },{ id:3,name:"Bob Johnson",email:"bob@techcorp.com",role:"MARKETER" }], uploads_list:[{ id:1,fileName:"google_ads_june.csv",platform:"Google Ads",status:"IMPORTED",date:"2024-06-15" },{ id:2,fileName:"meta_ads_june.csv",platform:"Meta Ads",status:"IMPORTED",date:"2024-06-14" },{ id:3,fileName:"google_ads_may.csv",platform:"Google Ads",status:"MAPPED",date:"2024-05-30" }] },
  "2": { id:2, name:"RetailMax",  health:"WARNING",  members:3, uploads:8,  metrics:{ totalSpend:18200, roas:2.8, ctr:1.9, cpc:2.10 }, members_list:[{ id:4,name:"Alice Brown",email:"alice@retailmax.com",role:"MARKETER" }], uploads_list:[{ id:4,fileName:"meta_ads_june.csv",platform:"Meta Ads",status:"IMPORTED",date:"2024-06-12" }] },
  "3": { id:3, name:"ServicePro", health:"CRITICAL", members:7, uploads:15, metrics:{ totalSpend:31000, roas:1.4, ctr:0.8, cpc:4.20 }, members_list:[{ id:5,name:"Chris Lee",email:"chris@servicepro.com",role:"MARKETER" }], uploads_list:[{ id:5,fileName:"google_ads_june.csv",platform:"Google Ads",status:"FAILED",date:"2024-06-10" }] },
  "4": { id:4, name:"NovaBrand",  health:"HEALTHY",  members:2, uploads:4,  metrics:{ totalSpend:9800,  roas:3.9, ctr:3.2, cpc:0.95 }, members_list:[], uploads_list:[] },
  "5": { id:5, name:"ZenMedia",   health:"WARNING",  members:4, uploads:9,  metrics:{ totalSpend:15600, roas:2.1, ctr:1.5, cpc:2.80 }, members_list:[], uploads_list:[] },
};

const HC: Record<string,{color:string;bg:string;border:string}> = {
  HEALTHY:  { color:"#3fb950", bg:"rgba(63,185,80,0.1)",  border:"rgba(63,185,80,0.25)"  },
  WARNING:  { color:"#d29922", bg:"rgba(210,153,34,0.1)", border:"rgba(210,153,34,0.25)" },
  CRITICAL: { color:"#f85149", bg:"rgba(248,81,73,0.1)",  border:"rgba(248,81,73,0.25)"  },
};

const STATUS: Record<string,{color:string;bg:string;border:string}> = {
  IMPORTED: { color:"#3fb950", bg:"rgba(63,185,80,0.1)",  border:"rgba(63,185,80,0.25)"  },
  MAPPED:   { color:"#5865f2", bg:"rgba(88,101,242,0.1)", border:"rgba(88,101,242,0.25)" },
  PENDING:  { color:"#d29922", bg:"rgba(210,153,34,0.1)", border:"rgba(210,153,34,0.25)" },
  FAILED:   { color:"#f85149", bg:"rgba(248,81,73,0.1)",  border:"rgba(248,81,73,0.25)"  },
};

const AVATAR_COLORS = ["#5865f2","#d29922","#3fb950","#f85149","#818cf8"];

export default function BrandDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const brandId  = params.id as string;
  const [brand, setBrand]   = useState<any>(null);
  const [tab, setTab]       = useState<"overview"|"members"|"uploads">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (raw && JSON.parse(raw).role !== "AGENCY_ADMIN") { router.push("/dashboard"); return; }
    setTimeout(() => { setBrand(BRANDS_DATA[brandId] || null); setLoading(false); }, 300);
  }, [brandId, router]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", fontFamily:"'Outfit',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%", border:"3px solid rgba(88,101,242,0.2)", borderTopColor:"#5865f2", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <p style={{ color:"var(--t2)", fontSize:"14px" }}>Loading brand...</p>
      </div>
    </div>
  );

  if (!brand) return (
    <div style={{ textAlign:"center", padding:"80px 20px", fontFamily:"'Outfit',sans-serif" }}>
      <p style={{ fontSize:"16px", color:"var(--t1)", fontWeight:"600", marginBottom:"8px" }}>Brand not found</p>
      <button onClick={() => router.push("/brands")} style={{ padding:"9px 20px", borderRadius:"9px", border:"none", background:"linear-gradient(135deg,#5865f2,#818cf8)", color:"white", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit" }}>← Back to Brands</button>
    </div>
  );

  const hc = HC[brand.health];
  const m  = brand.metrics;

  const KPI = [
    { label:"Total Spend", value:`$${m.totalSpend.toLocaleString()}`, color:"#5865f2", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { label:"ROAS",        value:`${m.roas}x`,   color:m.roas>=3?"#3fb950":m.roas>=2?"#d29922":"#f85149", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { label:"CTR",         value:`${m.ctr}%`,    color:m.ctr>=2?"#3fb950":m.ctr>=1?"#d29922":"#f85149",   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg> },
    { label:"CPC",         value:`$${m.cpc}`,    color:m.cpc<=1.5?"#3fb950":m.cpc<=3?"#d29922":"#f85149", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  ];

  return (
    <div style={{ animation:"fadeUp 0.4s ease both", fontFamily:"'Outfit',sans-serif" }}>
      {/* Back */}
      <button onClick={() => router.push("/brands")} style={{ display:"inline-flex", alignItems:"center", gap:"6px", marginBottom:"20px", padding:"7px 14px", borderRadius:"9px", border:"1px solid var(--border)", background:"var(--card)", color:"var(--t2)", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="#5865f2"; (e.currentTarget as HTMLElement).style.color="#5865f2"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; (e.currentTarget as HTMLElement).style.color="var(--t2)"; }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Brands
      </button>

      {/* Hero header */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"18px", padding:"28px", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"24px", flexWrap:"wrap" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:`linear-gradient(135deg,${hc.color}22,${hc.color}0a)`, border:`1px solid ${hc.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"24px", color:hc.color, flexShrink:0 }}>
            {brand.name[0]}
          </div>
          <div>
            <h1 style={{ fontSize:"26px", fontWeight:"800", color:"var(--t1)", marginBottom:"6px" }}>{brand.name}</h1>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
              <span style={{ fontSize:"12px", fontWeight:"700", padding:"4px 12px", borderRadius:"20px", background:hc.bg, color:hc.color, border:`1px solid ${hc.border}` }}>{brand.health}</span>
              <span style={{ fontSize:"13px", color:"var(--t2)" }}>{brand.members} members</span>
              <span style={{ fontSize:"13px", color:"var(--t3)" }}>·</span>
              <span style={{ fontSize:"13px", color:"var(--t2)" }}>{brand.uploads} uploads</span>
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
          {KPI.map(k => (
            <div key={k.label} style={{ padding:"16px", borderRadius:"12px", background:"var(--bg)", border:"1px solid var(--border)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                <span style={{ fontSize:"11px", color:"var(--t3)", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px" }}>{k.label}</span>
                <div style={{ color:"var(--t3)", opacity:0.6 }}>{k.icon}</div>
              </div>
              <p style={{ fontSize:"26px", fontWeight:"800", color:k.color, lineHeight:1 }}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"18px", overflow:"hidden" }}>
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", background:"var(--bg)", padding:"0 4px" }}>
          {(["overview","members","uploads"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"14px 20px", border:"none", background:"transparent", fontSize:"14px", fontWeight:tab===t?"700":"500", color:tab===t?"#5865f2":"var(--t2)", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", borderBottom:`2px solid ${tab===t?"#5865f2":"transparent"}`, textTransform:"capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding:"28px" }}>
          {/* Overview */}
          {tab === "overview" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"20px" }}>
                {[
                  { label:"Health Status", value:brand.health, color:hc.color },
                  { label:"Total Members", value:`${brand.members} users` },
                  { label:"Total Uploads", value:`${brand.uploads} files` },
                  { label:"Performance",   value:m.roas>=3?"Strong":m.roas>=2?"Moderate":"Needs Attention", color:m.roas>=3?"#3fb950":m.roas>=2?"#d29922":"#f85149" },
                ].map(f => (
                  <div key={f.label} style={{ padding:"16px", borderRadius:"12px", background:"var(--bg)", border:"1px solid var(--border)" }}>
                    <p style={{ fontSize:"11px", color:"var(--t3)", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>{f.label}</p>
                    <p style={{ fontSize:"15px", fontWeight:"700", color:(f as any).color||"var(--t1)" }}>{f.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding:"20px", borderRadius:"12px", background:"var(--bg)", border:"1px solid var(--border)" }}>
                <p style={{ fontSize:"13px", fontWeight:"700", color:"var(--t1)", marginBottom:"6px" }}>Campaign Health Summary</p>
                <p style={{ fontSize:"13px", color:"var(--t2)", lineHeight:1.6 }}>
                  {brand.name} is currently performing at a <strong style={{ color:hc.color }}>{brand.health.toLowerCase()}</strong> level.
                  ROAS of {m.roas}x {m.roas >= 3 ? "exceeds" : m.roas >= 2 ? "meets" : "is below"} the target benchmark of 3x.
                  CTR at {m.ctr}% and CPC at ${m.cpc} indicate {m.ctr >= 2 ? "strong" : "moderate"} audience engagement.
                </p>
              </div>
            </div>
          )}

          {/* Members */}
          {tab === "members" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <p style={{ fontSize:"15px", fontWeight:"700", color:"var(--t1)" }}>Team Members <span style={{ fontSize:"13px", color:"var(--t3)", fontWeight:"400" }}>({brand.members_list.length})</span></p>
              </div>
              {brand.members_list.length === 0 ? (
                <div style={{ textAlign:"center", padding:"50px", color:"var(--t3)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:"0 auto 12px", display:"block" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <p style={{ fontSize:"14px" }}>No members assigned yet</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {brand.members_list.map((mem: any, i: number) => (
                    <div key={mem.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderRadius:"12px", background:"var(--bg)", border:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                        <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:`linear-gradient(135deg,${AVATAR_COLORS[i%AVATAR_COLORS.length]},${AVATAR_COLORS[i%AVATAR_COLORS.length]}cc)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"700", fontSize:"15px" }}>
                          {mem.name[0]}
                        </div>
                        <div>
                          <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--t1)" }}>{mem.name}</p>
                          <p style={{ fontSize:"12px", color:"var(--t2)" }}>{mem.email}</p>
                        </div>
                      </div>
                      <span style={{ fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"6px", background:"rgba(88,101,242,0.08)", color:"#5865f2", border:"1px solid rgba(88,101,242,0.2)" }}>{mem.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Uploads */}
          {tab === "uploads" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <p style={{ fontSize:"15px", fontWeight:"700", color:"var(--t1)" }}>Recent Uploads <span style={{ fontSize:"13px", color:"var(--t3)", fontWeight:"400" }}>({brand.uploads_list.length})</span></p>
              </div>
              {brand.uploads_list.length === 0 ? (
                <div style={{ textAlign:"center", padding:"50px", color:"var(--t3)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:"0 auto 12px", display:"block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p style={{ fontSize:"14px" }}>No uploads yet</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {brand.uploads_list.map((up: any) => {
                    const sc = STATUS[up.status]||STATUS.PENDING;
                    return (
                      <div key={up.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderRadius:"12px", background:"var(--bg)", border:"1px solid var(--border)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                          <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"rgba(88,101,242,0.07)", border:"1px solid rgba(88,101,242,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#5865f2" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <div>
                            <p style={{ fontSize:"14px", fontWeight:"600", color:"var(--t1)" }}>{up.fileName}</p>
                            <p style={{ fontSize:"12px", color:"var(--t2)" }}>{up.platform} · {up.date}</p>
                          </div>
                        </div>
                        <span style={{ fontSize:"11px", fontWeight:"700", padding:"3px 10px", borderRadius:"6px", background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>{up.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}