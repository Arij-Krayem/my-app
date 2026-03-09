"use client";
import { useState } from "react";
import Link from "next/link";

type Health = "HEALTHY" | "WARNING" | "CRITICAL";
interface Brand { id: string; name: string; members: number; uploads: number; lastActivity: string; health: Health; spend: string; roas: string; }

const INIT: Brand[] = [
  { id: "1", name: "TechCorp",   members: 5, uploads: 12, lastActivity: "2 days ago",    health: "HEALTHY",  spend: "$24,500", roas: "4.2x" },
  { id: "2", name: "RetailMax",  members: 3, uploads: 8,  lastActivity: "1 day ago",     health: "WARNING",  spend: "$18,200", roas: "2.8x" },
  { id: "3", name: "ServicePro", members: 7, uploads: 15, lastActivity: "3 hours ago",   health: "CRITICAL", spend: "$31,000", roas: "1.4x" },
  { id: "4", name: "NovaBrand",  members: 2, uploads: 4,  lastActivity: "5 days ago",    health: "HEALTHY",  spend: "$9,800",  roas: "3.9x" },
  { id: "5", name: "ZenMedia",   members: 4, uploads: 9,  lastActivity: "12 hours ago",  health: "WARNING",  spend: "$15,600", roas: "2.1x" },
];

const HEALTH_CFG: Record<Health, { color: string; bg: string; border: string; dot: string }> = {
  HEALTHY:  { color: "#3fb950", bg: "rgba(63,185,80,0.1)",  border: "rgba(63,185,80,0.25)",  dot: "#3fb950" },
  WARNING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)", dot: "#d29922" },
  CRITICAL: { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)",  dot: "#f85149" },
};

export default function BrandsPage() {
  const [brands, setBrands]   = useState<Brand[]>(INIT);
  const [showModal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<"ALL" | Health>("ALL");

  const addBrand = () => {
    if (!newName.trim()) return;
    setBrands(b => [...b, { id: Date.now().toString(), name: newName.trim(), members: 0, uploads: 0, lastActivity: "Just now", health: "HEALTHY", spend: "$0", roas: "—" }]);
    setNewName(""); setModal(false);
  };

  const visible = brands
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    .filter(b => filter === "ALL" || b.health === filter);

  const stats = {
    total:    brands.length,
    healthy:  brands.filter(b => b.health === "HEALTHY").length,
    warning:  brands.filter(b => b.health === "WARNING").length,
    critical: brands.filter(b => b.health === "CRITICAL").length,
  };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Brands</h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Manage all client workspaces and their performance</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.35)", transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
          + New Brand
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Brands",    value: stats.total,    color: "#5865f2" },
          { label: "Healthy",         value: stats.healthy,  color: "#3fb950" },
          { label: "Need Attention",  value: stats.warning,  color: "#d29922" },
          { label: "Critical",        value: stats.critical, color: "#f85149" },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--t2)", fontWeight: "500" }}>{s.label}</span>
            <span style={{ fontSize: "24px", fontWeight: "700", color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--t3)" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands..." style={{ width: "100%", padding: "9px 12px 9px 36px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" }}
            onFocus={e => { e.target.style.borderColor = "#5865f2"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; }} />
        </div>
        <div style={{ display: "flex", gap: "4px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px" }}>
          {(["ALL","HEALTHY","WARNING","CRITICAL"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600", fontFamily: "inherit", transition: "all 0.15s", background: filter === f ? "linear-gradient(135deg,#5865f2,#818cf8)" : "transparent", color: filter === f ? "white" : "var(--t2)" }}>
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 80px 100px 120px 120px 120px", padding: "14px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
          {["Brand","Members","Uploads","Health","Spend","ROAS","Actions"].map(h => (
            <span key={h} style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ color:"var(--t3)", display:"flex", justifyContent:"center", marginBottom:"12px" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
            <p style={{ color: "var(--t2)", fontSize: "14px" }}>No brands match your search.</p>
          </div>
        ) : (
          visible.map((b, i) => {
            const hc = HEALTH_CFG[b.health];
            return (
              <div key={b.id} style={{ display: "grid", gridTemplateColumns: "2fr 90px 80px 100px 120px 120px 120px", padding: "16px 24px", alignItems: "center", gap: "8px", borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>

                {/* Brand name */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg, ${hc.dot}30, ${hc.dot}10)`, border: `1px solid ${hc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "15px", color: hc.color, flexShrink: 0 }}>
                    {b.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{b.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--t3)" }}>Active {b.lastActivity}</div>
                  </div>
                </div>

                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{b.members}</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>{b.uploads}</span>

                {/* Health badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: hc.dot, flexShrink: 0, boxShadow: `0 0 6px ${hc.dot}` }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: hc.color }}>{b.health}</span>
                </div>

                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)", fontVariantNumeric: "tabular-nums" }}>{b.spend}</span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: b.roas === "—" ? "var(--t3)" : parseFloat(b.roas) >= 3 ? "#3fb950" : parseFloat(b.roas) >= 2 ? "#d29922" : "#f85149" }}>{b.roas}</span>

                {/* Actions */}
                <Link href={`/brands/${b.id}`} style={{ fontSize: "12px", fontWeight: "600", color: "#5865f2", textDecoration: "none", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(88,101,242,0.3)", background: "rgba(88,101,242,0.08)", transition: "all 0.15s", display: "inline-block" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.15)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.08)"; }}>
                  View →
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* New Brand Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "380px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", animation: "fadeUp 0.25s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)" }}>New Brand</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "var(--t3)", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Brand Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addBrand()} placeholder="e.g. TechCorp" style={{ width: "100%", padding: "11px 14px", background: "var(--input)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--t1)", fontSize: "14px", fontFamily: "inherit", outline: "none", marginBottom: "20px", transition: "border-color 0.2s" }}
              onFocus={e => { e.target.style.borderColor = "#5865f2"; e.target.style.boxShadow = "0 0 0 3px rgba(88,101,242,0.15)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              autoFocus />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={addBrand} style={{ flex: 2, padding: "11px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#5865f2,#818cf8)", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.35)" }}>Create Brand</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}