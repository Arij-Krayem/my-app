"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const SVG = {
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  uploads:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  alerts:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  guardrails:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  anomalies: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  settings:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  brands:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  users:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  detection: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h2l3-9 4 18 3-9h2"/></svg>,
  bell:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  menu:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  logout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const NAV_ITEMS = [
  { href: "/dashboard",  icon: SVG.dashboard,  label: "Dashboard"  },
  { href: "/uploads",    icon: SVG.uploads,    label: "Uploads"    },
  { href: "/alerts",     icon: SVG.alerts,     label: "Alerts"     },
  { href: "/guardrails", icon: SVG.guardrails, label: "Guardrails" },
  { href: "/anomalies",  icon: SVG.anomalies,  label: "Anomalies"  },
  { href: "/settings",   icon: SVG.settings,   label: "Settings"   },
];

const ADMIN_ITEMS = [
  { href: "/brands",    icon: SVG.brands,    label: "Brands"    },
  { href: "/users",     icon: SVG.users,     label: "Users"     },
  { href: "/detection", icon: SVG.detection, label: "Detection" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed]    = useState(false);
  const [user, setUser]              = useState<{ name: string; email: string; role: string } | null>(null);
  const [brands, setBrands]          = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelected] = useState("");
  const [notifCount]                 = useState(3);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    const token = sessionStorage.getItem("access_token");
    const raw   = sessionStorage.getItem("user");
    if (!token || !raw) { router.push("/login"); return; }
    try {
      const u = JSON.parse(raw);
      setUser(u);
      if (u.role === "AGENCY_ADMIN") {
        fetch("/api/brands", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
          .then(r => r.ok ? r.json() : [])
          .then(d => {
            const list = d.items ?? d;
            setBrands(list);
            if (list[0]) setSelected(list[0].id);
          });
      }
    } catch { router.push("/login"); }
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("access_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        credentials: "include",
      });
    } catch {}
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };
  const isAdmin = user?.role === "AGENCY_ADMIN";
  const allNav  = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;
  const sideW   = collapsed ? "68px" : "230px";
  const pageTitle = allNav.find(n => {
    if (n.href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(n.href);
  })?.label ?? "Dashboard";

  const navLink = (item: { href: string; icon: React.ReactNode; label: string }) => {
    const active = item.href === "/dashboard"
      ? pathname === "/dashboard"
      : !!pathname?.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setCollapsed(true)}
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "10px 12px", borderRadius: "10px", marginBottom: "2px",
          textDecoration: "none", fontWeight: active ? "600" : "400",
          fontSize: "14px", transition: "all 0.15s",
          background: active ? "linear-gradient(135deg,#5865f2,#818cf8)" : "transparent",
          color: active ? "white" : "var(--t2)",
          boxShadow: active ? "0 4px 12px rgba(88,101,242,0.25)" : "none",
          whiteSpace: "nowrap", overflow: "hidden",
        }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.07)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; } }}
      >
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center", width: "20px" }}>{item.icon}</span>
        {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "'Outfit', sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{
        position: "fixed", top: 0, left: 0, height: "100vh", width: sideW,
        background: "var(--bg2)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", zIndex: 50, overflow: "hidden",
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}>
        {/* Logo */}
        <div style={{ height: "68px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--border)", gap: "12px", flexShrink: 0 }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0, background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white", fontSize: "16px", boxShadow: "0 4px 12px rgba(88,101,242,0.3)" }}>V</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--t1)", lineHeight: 1 }}>VISIO<span style={{ color: "#5865f2" }}>AD</span></div>
              <div style={{ fontSize: "10px", color: "var(--t2)", marginTop: "2px" }}>Ads Monitor</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map(navLink)}
          {isAdmin && (
            <>
              <div style={{ margin: "16px 4px 8px", fontSize: "10px", fontWeight: "700", color: "var(--t3)", letterSpacing: "1px", textTransform: "uppercase", display: collapsed ? "none" : "block" }}>Admin</div>
              {collapsed && <div style={{ height: "1px", background: "var(--border)", margin: "12px 4px" }} />}
              {ADMIN_ITEMS.map(navLink)}
            </>
          )}
        </nav>

        {/* User card */}
        {!collapsed && user && (
          <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ padding: "12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "14px" }}>
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || user.email}</div>
                  <div style={{ fontSize: "11px", color: "#5865f2", marginTop: "1px", fontWeight: "600" }}>{user.role.replace("_", " ")}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft: sideW, flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "margin-left 0.25s ease" }}>

        {/* Topbar */}
        <header style={{ position: "sticky", top: 0, zIndex: 40, height: "68px", background: "var(--bg2)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--t2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--border)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
            >
              {SVG.menu}
            </button>
            <h1 style={{ fontSize: "18px", fontWeight: "600", color: "var(--t1)" }}>{pageTitle}</h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isAdmin && brands.length > 0 && (
              <select value={selectedBrand} onChange={e => setSelected(e.target.value)} style={{ padding: "8px 12px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--t1)", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            {/* Bell */}
            <div style={{ position: "relative" }}>
              <button style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--t2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {SVG.bell}
              </button>
              {notifCount > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: "var(--danger)", color: "white", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>{notifCount}</span>
              )}
            </div>

            {/* Avatar + dropdown */}
            {user && (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setShowDropdown(d => !d)}
                  style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "14px", boxShadow: "0 2px 8px rgba(88,101,242,0.25)", border: "none", cursor: "pointer" }}
                >
                  {(user.name || user.email)[0].toUpperCase()}
                </button>

                {showDropdown && (
                  <div style={{ position: "absolute", top: "44px", right: 0, width: "200px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden", animation: "fadeUp 0.15s ease both" }}>
                    {/* User info */}
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)", marginBottom: "2px" }}>{user.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                      <div style={{ fontSize: "10px", color: "#5865f2", fontWeight: "700", marginTop: "3px" }}>{user.role.replace("_", " ")}</div>
                    </div>
                    {/* Logout button */}
                    <button
                      onClick={handleLogout}
                      style={{ width: "100%", padding: "11px 14px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", color: "#f85149", fontSize: "13px", fontWeight: "600", fontFamily: "inherit", textAlign: "left", transition: "background 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.07)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {SVG.logout}
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: "32px", background: "var(--bg)", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}