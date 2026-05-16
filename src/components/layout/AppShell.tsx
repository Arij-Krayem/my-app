"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/user/UserAvatar";
import styles from "./AppShell.module.css";

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["MARKETER", "AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/leads",
    label: "Leads",
    roles: ["MARKETER", "AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/uploads",
    label: "Uploads",
    roles: ["MARKETER", "AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    href: "/users",
    label: "Users",
    roles: ["AGENCY_ADMIN"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const shellStateClass = collapsed ? styles.collapsed : styles.expanded;

  const visibleNav = NAV.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className={`${styles.shell} ${shellStateClass}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18l4-8 4 4 4-6 4 10" />
              </svg>
            </div>
            <span className={styles.logoName}>Visioad</span>
          </Link>
          <button className={styles.collapseButton} onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {collapsed
                ? <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
                : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="15" y2="6" /><line x1="3" y1="18" x2="15" y2="18" /></>
              }
            </svg>
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navLabel}>Menu</div>
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navText}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              <UserAvatar
                name={user?.name}
                email={user?.email}
                avatarUrl={user?.avatarUrl}
                size={32}
                borderRadius={999}
              />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userEmail}>{user?.email}</div>
              <div className={styles.userRole}>{user?.role}</div>
            </div>
            <button className={styles.logoutButton} onClick={logout} title="Log out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.mainWrap}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>
            {NAV.find(n => pathname.startsWith(n.href))?.label ?? "Visioad"}
          </span>
          <div className={styles.topbarSpacer} />
          <span className={styles.topbarBadge}>
            {user?.role === "AGENCY_ADMIN" ? "Admin" : "Marketer"}
          </span>
        </header>

        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
