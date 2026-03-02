"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard",   icon: "⊞",  label: "Dashboard"  },
  { href: "/uploads",     icon: "↑",   label: "Uploads"    },
  { href: "/alerts",      icon: "⚡",  label: "Alerts"     },
  { href: "/guardrails",  icon: "🛡",  label: "Guardrails" },
  { href: "/anomalies",   icon: "📉",  label: "Anomalies"  },
  { href: "/settings",    icon: "⚙",   label: "Settings"   },
];

const ADMIN_ITEMS = [
  { href: "/brands",    icon: "◈",  label: "Brands"    },
  { href: "/users",     icon: "◉",  label: "Users"     },
  { href: "/detection", icon: "🎛", label: "Detection" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed]   = useState(false);
  const [theme, setTheme]           = useState("dark");
  const [user, setUser]             = useState<{ name: string; email: string; role: string } | null>(null);
  const [brands, setBrands]         = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelected] = useState("");
  const [notifCount]                = useState(3);

  useEffect(() => {
    const t = localStorage.getItem("theme") || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);

    const token = sessionStorage.getItem("access_token");
    const raw   = sessionStorage.getItem("user");
    if (!token || !raw) { router.push("/login"); return; }
    try {
      const u = JSON.parse(raw);
      setUser(u);
      if (u.role === "AGENCY_ADMIN") {
        fetch("/api/brands", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
          .then(r => r.ok ? r.json() : [])
          .then(d => { setBrands(d); if (d[0]) setSelected(d[0].id); });
      }
    } catch { router.push("/login"); }
  }, [router]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    sessionStorage.clear();
    router.push("/login");
  };

  const isAdmin = user?.role === "AGENCY_ADMIN";
  const allNav  = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;
  const sideW   = collapsed ? "68px" : "230px";
  const pageTitle = allNav.find(n => pathname === n.href)?.label ?? "Dashboard";

  const navLink = (item: { href: string; icon: string; label: string }) => {
    const active = pathname === item.href;
    return (
      <Link key={item.href} href={item.href} style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "11px 12px", borderRadius: "10px", marginBottom: "2px",
        textDecoration: "none", fontWeight: active ? "600" : "400",
        fontSize: "14px", transition: "all 0.15s",
        background: active ? "linear-gradient(135deg,#5865f2,#818cf8)" : "transparent",
        color: active ? "white" : "var(--t2)",
        boxShadow: active ? "0 4px 14px rgba(88,101,242,0.3)" : "none",
        whiteSpace: "nowrap", overflow: "hidden",
      }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--t1)"; } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; } }}
      >
        <span style={{ fontSize: "17px", flexShrink: 0, width: "22px", textAlign: "center" }}>{item.icon}</span>
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", fontFamily: "'Outfit', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, height: "100vh",
        width: sideW, background: "var(--bg2)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", zIndex: 50, overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          height: "68px", display: "flex", alignItems: "center",
          padding: "0 16px", borderBottom: "1px solid var(--border)",
          gap: "12px", flexShrink: 0,
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
            background: "linear-gradient(135deg,#5865f2,#818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", color: "white", fontSize: "16px",
            boxShadow: "0 4px 12px rgba(88,101,242,0.35)",
          }}>V</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--t1)", lineHeight: 1 }}>
                VISIO<span style={{ color: "#5865f2" }}>AD</span>
              </div>
              <div style={{ fontSize: "10px", color: "var(--t2)", marginTop: "2px" }}>Ads Monitor</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {/* Main nav */}
          {NAV_ITEMS.map(navLink)}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div style={{ margin: "16px 4px 8px", fontSize: "10px", fontWeight: "700", color: "var(--t3)", letterSpacing: "1px", textTransform: "uppercase", display: collapsed ? "none" : "block" }}>
                Admin
              </div>
              {collapsed && <div style={{ height: "1px", background: "var(--border)", margin: "12px 4px" }} />}
              {ADMIN_ITEMS.map(navLink)}
            </>
          )}
        </nav>

        {/* User info + sign out */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          {!collapsed && user && (
            <div style={{
              padding: "12px", borderRadius: "10px",
              background: "var(--bg)", border: "1px solid var(--border)",
              marginBottom: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                  background: "linear-gradient(135deg,#5865f2,#818cf8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: "700", fontSize: "14px",
                }}>
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                  <div style={{ fontSize: "11px", color: "#5865f2", marginTop: "1px" }}>{user.role.replace("_", " ")}</div>
                </div>
              </div>
            </div>
          )}
          <button onClick={signOut} style={{
            width: "100%", padding: "10px 12px", borderRadius: "10px",
            background: "transparent", border: "1px solid var(--danger)",
            color: "var(--danger)", fontSize: "13px", fontWeight: "600",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: "8px", transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,81,73,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span>⬡</span>
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ marginLeft: sideW, flex: 1, display: "flex", flexDirection: "column", minWidth: 0, transition: "margin-left 0.25s ease" }}>

        {/* Topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          height: "68px", background: "var(--bg2)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 24px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => setCollapsed(!collapsed)} style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--bg)", border: "1px solid var(--border)",
              cursor: "pointer", color: "var(--t2)", fontSize: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>☰</button>
            <h1 style={{ fontSize: "18px", fontWeight: "600", color: "var(--t1)" }}>{pageTitle}</h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Brand switcher - admin only */}
            {isAdmin && brands.length > 0 && (
              <select value={selectedBrand} onChange={e => setSelected(e.target.value)} style={{
                padding: "8px 12px", borderRadius: "10px",
                background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--t1)", fontSize: "13px", fontFamily: "inherit",
                cursor: "pointer", outline: "none",
              }}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "var(--bg)", border: "1px solid var(--border)",
                cursor: "pointer", color: "var(--t2)", fontSize: "16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>🔔</button>
              {notifCount > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "var(--danger)", color: "white",
                  fontSize: "10px", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{notifCount}</span>
              )}
            </div>

            {/* Theme */}
            <button onClick={toggleTheme} style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--bg)", border: "1px solid var(--border)",
              cursor: "pointer", fontSize: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Avatar */}
            {user && (
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg,#5865f2,#818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "700", fontSize: "14px",
              }}>
                {(user.name || user.email)[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "32px", background: "var(--bg)", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}