"use client";

import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Tooltip } from "antd";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import UserAvatar from "@/components/user/UserAvatar";
import AnomalyToast from "@/components/feedback/AnomalyToast";
import { readSessionUser, userSessionEventName, type SessionUser } from "@/lib/session/session-user";
import { installSessionFetchInterceptor } from "@/lib/session/session-fetch";

const SVG = {
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  uploads: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  alerts: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  guardrails: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  anomalies: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  settings: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  brands: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  users: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  detection: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h2l3-9 4 18 3-9h2" /></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  menu: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
};

const NAV_ITEMS = [
  { href: "/dashboard", icon: SVG.dashboard, label: "Dashboard" },
  { href: "/brands",    icon: SVG.brands,    label: "Brands"    },
  { href: "/uploads",   icon: SVG.uploads,   label: "Uploads"   },
  { href: "/alerts",    icon: SVG.alerts,    label: "Alerts"    },
  { href: "/guardrails",icon: SVG.guardrails,label: "Guardrails"},
  { href: "/anomalies", icon: SVG.anomalies, label: "Anomalies" },
  { href: "/detection", icon: SVG.detection, label: "Detection" },
  { href: "/users",     icon: SVG.users,     label: "Users", adminOnly: true },
  { href: "/settings",  icon: SVG.settings,  label: "Settings"  },
];
interface AlertNotif {
  id: string; message: string; status: string; createdAt: string;
  rule?: { metricKey: string; severity: string } | null;
  brand?: { name: string } | null;
}
interface NavItem { href: string; icon: ReactNode; label: string; adminOnly?: boolean; }

function getStoredUser() {
  return readSessionUser();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isActivePath(pathname: string | null, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return Boolean(pathname?.startsWith(href));
}

function SidebarItem({
  item, pathname, collapsed, onNavigate,
}: { item: NavItem; pathname: string | null; collapsed: boolean; onNavigate: () => void; }) {
  const active = isActivePath(pathname, item.href);
  const link = (
    <Link href={item.href} onClick={onNavigate}
      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>
      <span className={styles.navIcon}>{item.icon}</span>
      {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
    </Link>
  );
  if (!collapsed) return link;
  return <Tooltip placement="right" title={item.label}>{link}</Tooltip>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed,     setCollapsed]     = useState(false);
  const [user,          setUser]          = useState<SessionUser | null>(null);
  const [userReady,     setUserReady]     = useState(false);
  const [brands,        setBrands]        = useState<{ id: string; name: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [showBell,      setShowBell]      = useState(false);
  const [notifications, setNotifications] = useState<AlertNotif[]>([]);
  const [notifCount,    setNotifCount]    = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef     = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    installSessionFetchInterceptor();
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch("/api/alerts?status=OPEN&pageSize=5", {
        headers: { Authorization: `Bearer ${token}` }, credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      const items: AlertNotif[] = data.latestAlerts ?? data.items ?? [];
      setNotifications(items.slice(0, 5));
      setNotifCount(Number(data.totalOpenAlerts ?? data.totalItems ?? items.length));
    } catch {}
  }, []);

  useEffect(() => {
    const syncUserFromSession = () => {
      setUser(getStoredUser());
      setUserReady(true);
    };

    const handleUserUpdate = (event: Event) => {
      const nextUser = (event as CustomEvent<{ user: SessionUser }>).detail?.user;
      if (nextUser) setUser(nextUser);
    };

    const timeout = window.setTimeout(syncUserFromSession, 0);
    window.addEventListener(userSessionEventName(), handleUserUpdate);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(userSessionEventName(), handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    if (!userReady) return;
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    const token = sessionStorage.getItem("access_token");
    if (!token || !user) { router.push("/login"); return; }

    fetch("/api/brands", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = data.items ?? data;
        setBrands(list);
        if (list[0]) {
          setSelectedBrand(list[0].id);
          // ── Fire initial brand event so dashboard loads the right brand ──
          window.dispatchEvent(new CustomEvent("brand-change", { detail: { brandId: list[0].id } }));
        }
      });

    const timeout = window.setTimeout(() => { void fetchNotifications(); }, 0);

    // Keep dropdown in sync when dashboard pill buttons are clicked
    const syncHandler = (e: Event) => {
      const brandId = (e as CustomEvent<{ brandId: string }>).detail.brandId;
      if (brandId) setSelectedBrand(brandId);
    };
    window.addEventListener("brand-change-sync", syncHandler);
    window.addEventListener("alerts-refresh", fetchNotifications);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("brand-change-sync", syncHandler);
      window.removeEventListener("alerts-refresh", fetchNotifications);
    };
  }, [fetchNotifications, router, user, userReady]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (pathname === "/alerts") {
      const timeout = window.setTimeout(() => { void fetchNotifications(); }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [fetchNotifications, pathname]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
      if (bellRef.current     && !bellRef.current.contains(event.target as Node))     setShowBell(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Brand switcher handler — fires custom event consumed by dashboard 
  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    window.dispatchEvent(new CustomEvent("brand-change", { detail: { brandId } }));
  };

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

  const isAdmin        = user?.role === "AGENCY_ADMIN";
  const shellStateClass = collapsed ? styles.shellCollapsed : styles.shellExpanded;
  const severityClass = (severity?: string) => severity === "CRITICAL" ? styles.notificationCritical : styles.notificationWarning;

  return (
    <div className={`${styles.shell} ${shellStateClass}`}>
      <AnomalyToast />
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBlock}>
            <div className={styles.logoIcon}>V</div>
            {!collapsed && (
              <div className={styles.logoText}>
                <div className={styles.logoTitle}>VISIO<span>AD</span></div>
                <div className={styles.logoSubtitle}>Ads Monitor</div>
              </div>
            )}
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
            <SidebarItem key={item.href} item={item} pathname={pathname}
              collapsed={collapsed} onNavigate={() => setCollapsed(true)} />
          ))}
        </nav>

        {!collapsed && user && (
          <div className={styles.sidebarFooter}>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>
                <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size={38} borderRadius={999} />
              </div>
              <div className={styles.userMeta}>
                <div className={styles.userName}>{user.name || user.email}</div>
                <div className={styles.userRole}>{user.role.replace("_", " ")}</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button type="button" onClick={() => setCollapsed(v => !v)}
              className={styles.iconButton} aria-label="Toggle sidebar">
              {SVG.menu}
            </button>
          </div>

          <div className={styles.topbarRight}>
            {brands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={e => handleBrandChange(e.target.value)}  // ← FIXED
                className={styles.brandSelect}
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            )}

            {/* Notification Bell */}
            <div ref={bellRef} className={styles.popoverAnchor}>
              <button type="button"
                onClick={() => { setShowBell(v => !v); if (!showBell) fetchNotifications(); }}
                className={`${styles.iconButton} ${notifCount > 0 ? styles.iconButtonAlert : ""}`}
                aria-label="Toggle notifications">
                {SVG.bell}
              </button>
              {notifCount > 0 && (
                <span className={styles.notificationBadge}>{notifCount}</span>
              )}
              {showBell && (
                <div className={`${styles.dropdownPanel} ${styles.notificationsPanel}`}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.notificationsTitleWrap}>
                      <span className={styles.dropdownTitle}>Notifications</span>
                      {notifCount > 0 && <span className={styles.alertCountBadge}>{notifCount} open</span>}
                    </div>
                    <Link href="/alerts" onClick={() => setShowBell(false)} className={styles.dropdownLink}>View all</Link>
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>!</div>
                        <p className={styles.emptyStateText}>No open alerts</p>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const severity = notif.rule?.severity ?? (notif.message.toLowerCase().includes("critical") ? "CRITICAL" : "WARNING");
                        const notifSeverityClass = severityClass(severity);
                        return (
                          <Link key={notif.id} href="/alerts" onClick={() => setShowBell(false)} className={styles.notificationLink}>
                            <div className={`${styles.notificationItem} ${notifSeverityClass}`}>
                              <div className={styles.notificationDot} />
                              <div className={styles.notificationBody}>
                                <div className={styles.notificationTopRow}>
                                  <span className={styles.notificationMetric}>{notif.rule?.metricKey ?? "Alert"}</span>
                                  <span className={styles.notificationTime}>{timeAgo(notif.createdAt)}</span>
                                </div>
                                <p className={styles.notificationMessage}>{notif.message}</p>
                                {notif.brand?.name && <span className={styles.notificationBrand}>{notif.brand.name}</span>}
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  {notifCount > 5 && (
                    <div className={styles.dropdownFooter}>
                      <Link href="/alerts" onClick={() => setShowBell(false)} className={styles.dropdownLink}>
                        View {notifCount - 5} more alerts
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            {user && (
              <div ref={dropdownRef} className={styles.popoverAnchor}>
                <button type="button" onClick={() => setShowDropdown(v => !v)}
                  className={styles.avatarButton} aria-label="Toggle user menu">
                  <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size={40} borderRadius={12} />
                </button>
                {showDropdown && (
                  <div className={`${styles.dropdownPanel} ${styles.userMenuPanel}`}>
                    <div className={styles.userMenuHeader}>
                      <div className={styles.userMenuName}>{user.name}</div>
                      <div className={styles.userMenuEmail}>{user.email}</div>
                      <div className={styles.userMenuRole}>{user.role.replace("_", " ")}</div>
                    </div>
                    <button type="button" onClick={handleLogout} className={styles.logoutButton}>
                      {SVG.logout} Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className={styles.pageContent}>
          <div className={styles.pageInner}>{children}</div>
        </main>
      </div>
    </div>
  );
}
