"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["MARKETER", "AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/leads",
    label: "Leads",
    roles: ["MARKETER", "AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/uploads",
    label: "Uploads",
    roles: ["MARKETER", "AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    href: "/users",
    label: "Users",
    roles: ["AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = NAV.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --sidebar-w: ${collapsed ? "72px" : "230px"};
          --bg: #0d0f12;
          --surface: #13161b;
          --surface2: #1a1e25;
          --border: #242830;
          --accent: #6c63ff;
          --accent-dim: rgba(108, 99, 255, 0.15);
          --text: #e8eaf0;
          --text-muted: #6b7280;
          --danger: #f43f5e;
          --success: #10b981;
          --font: 'Plus Jakarta Sans', sans-serif;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font); }

        .shell { display: flex; min-height: 100vh; }

        /* ── Sidebar ── */
        .sidebar {
          width: var(--sidebar-w);
          min-height: 100vh;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0; top: 0; bottom: 0;
          z-index: 100;
          transition: width 0.22s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 16px 16px;
          border-bottom: 1px solid var(--border);
          min-height: 64px;
          gap: 10px;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          text-decoration: none;
        }

        .logo-icon {
          width: 34px;
          height: 34px;
          background: var(--accent);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logo-name {
          font-size: 17px;
          font-weight: 800;
          color: var(--text);
          white-space: nowrap;
          letter-spacing: -0.3px;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.15s;
        }

        .collapse-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          flex-shrink: 0;
          transition: color 0.15s, background 0.15s;
        }
        .collapse-btn:hover { color: var(--text); background: var(--surface2); }

        .sidebar-nav {
          flex: 1;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 8px 4px;
          white-space: nowrap;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.1s;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 10px;
          border-radius: 9px;
          text-decoration: none;
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
          position: relative;
        }

        .nav-item:hover { background: var(--surface2); color: var(--text); }

        .nav-item.active {
          background: var(--accent-dim);
          color: var(--accent);
          font-weight: 600;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 25%; bottom: 25%;
          width: 3px;
          background: var(--accent);
          border-radius: 0 3px 3px 0;
        }

        .nav-icon { flex-shrink: 0; }
        .nav-text { opacity: ${collapsed ? 0 : 1}; transition: opacity 0.1s; }

        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid var(--border);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 9px;
          overflow: hidden;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .user-info {
          overflow: hidden;
          flex: 1;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.1s;
        }

        .user-email {
          font-size: 12px;
          color: var(--text);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 1px;
        }

        .logout-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          flex-shrink: 0;
          transition: color 0.15s;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.1s, color 0.15s;
        }
        .logout-btn:hover { color: var(--danger); }

        /* ── Main area ── */
        .main-wrap {
          margin-left: var(--sidebar-w);
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
        }

        .topbar {
          height: 64px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 28px;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topbar-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.3px;
        }

        .topbar-spacer { flex: 1; }

        .topbar-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          background: var(--accent-dim);
          color: var(--accent);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .page-content {
          flex: 1;
          padding: 32px 28px;
        }

        /* Mobile overlay */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            width: 230px !important;
          }
          .main-wrap { margin-left: 0; }
          .logo-name, .nav-text, .user-info, .logout-btn { opacity: 1 !important; }
        }
      `}</style>

      <div className="shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link href="/dashboard" className="logo-wrap">
              <div className="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18l4-8 4 4 4-6 4 10"/>
                </svg>
              </div>
              <span className="logo-name">Visioad</span>
            </Link>
            <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {collapsed
                  ? <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
                  : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="18" x2="15" y2="18"/></>
                }
              </svg>
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-label">Menu</div>
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${pathname === item.href || pathname.startsWith(item.href + "/") ? " active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="avatar">
                <UserAvatar
                  name={user?.name}
                  email={user?.email}
                  avatarUrl={user?.avatarUrl}
                  size={32}
                  borderRadius={999}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="user-info">
                <div className="user-email">{user?.email}</div>
                <div className="user-role">{user?.role}</div>
              </div>
              <button className="logout-btn" onClick={logout} title="Log out">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main-wrap">
          <header className="topbar">
            <span className="topbar-title">
              {NAV.find(n => pathname.startsWith(n.href))?.label ?? "Visioad"}
            </span>
            <div className="topbar-spacer" />
            <span className="topbar-badge">
              {user?.role === "AGENCY_ADMIN" ? "Admin" : "Marketer"}
            </span>
          </header>

          <main className="page-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
