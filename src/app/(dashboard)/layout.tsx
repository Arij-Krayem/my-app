"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tooltip } from "antd";

import { NAV_ITEMS, SIDEBAR_WIDTHS } from "@/lib/constants";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SessionUser {
  email: string;
  name: string;
  role: "AGENCY_ADMIN" | "MARKETER";
}

interface BrandOption {
  id: string;
  name: string;
}

const topbarHeight = "68px";

export default function DashboardLayout({ children }: DashboardLayoutProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [user] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") return null;
    const rawUser = sessionStorage.getItem("user");
    return rawUser ? (JSON.parse(rawUser) as SessionUser) : null;
  });

  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");

    const token = sessionStorage.getItem("access_token");
    if (!token || !user) {
      router.push("/login");
      return;
    }

    try {
      if (user.role === "AGENCY_ADMIN") {
        fetch("/api/brands", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
          .then((response) => (response.ok ? response.json() : { items: [] }))
          .then((data) => {
            const items = (data.items ?? data) as BrandOption[];
            setBrands(items);
            if (items[0]) setSelectedBrand(items[0].id);
          })
          .catch(() => setBrands([]));
      }
    } catch {
      router.push("/login");
    }
  }, [router, user]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => (item.adminOnly ? user?.role === "AGENCY_ADMIN" : true)),
    [user?.role],
  );

  const sideW = `${collapsed ? SIDEBAR_WIDTHS.collapsed : SIDEBAR_WIDTHS.expanded}px`;
  const logout = async (): Promise<void> => {
    try {
      const token = sessionStorage.getItem("access_token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
        credentials: "include",
      });
    } catch {
      // Ignore logout network failures and clear the session locally.
    }

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", color: "var(--t1)" }}>
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: sideW,
            background: "var(--bg2)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "all 0.25s ease",
            zIndex: 50,
          }}
        >
          <div
            style={{
              height: topbarHeight,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              borderBottom: "1px solid var(--border)",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                flexShrink: 0,
                background: "linear-gradient(135deg,#5865f2,#818cf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#ffffff",
                fontSize: "16px",
                boxShadow: "0 4px 12px rgba(88,101,242,0.3)",
              }}
            >
              V
            </div>
            {!collapsed ? (
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--t1)", lineHeight: 1 }}>
                  VISIO<span style={{ color: "#5865f2" }}>AD</span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--t2)", marginTop: "2px" }}>Ads Monitor</div>
              </div>
            ) : null}
          </div>

          <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            {visibleNavItems.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              const icon = (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, flexShrink: 0 }}>
                  {item.icon}
                </span>
              );

              return (
                <Tooltip
                  key={item.id}
                  title={item.label}
                  placement="right"
                  color="#1e2035"
                  overlayInnerStyle={{
                    fontSize: "12px",
                    padding: "5px 12px",
                    borderRadius: "8px",
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div>
                    <Link
                      href={item.href}
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        marginBottom: "4px",
                        textDecoration: "none",
                        fontWeight: active ? 600 : 500,
                        fontSize: "14px",
                        transition: "all 0.15s ease",
                        background: active ? "linear-gradient(135deg,#5865f2,#818cf8)" : "transparent",
                        color: active ? "#ffffff" : "var(--t2)",
                        boxShadow: active ? "0 4px 12px rgba(88,101,242,0.25)" : "none",
                        justifyContent: collapsed ? "center" : "flex-start",
                      }}
                    >
                      {icon}
                      {!collapsed ? <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span> : null}
                    </Link>
                  </div>
                </Tooltip>
              );
            })}
          </nav>

          {user ? (
            <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
              <div
                style={{
                  padding: collapsed ? "10px 0" : "12px",
                  borderRadius: "10px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: "linear-gradient(135deg,#5865f2,#818cf8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {(user.name || user.email)[0]?.toUpperCase()}
                </div>
                {!collapsed ? (
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--t1)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.name || user.email}
                    </div>
                    <div style={{ fontSize: "11px", color: "#5865f2", marginTop: "1px", fontWeight: 600 }}>
                      {user.role.replace("_", " ")}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>

        <div
          style={{
            marginLeft: sideW,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            transition: "all 0.25s ease",
          }}
        >
          <header
            style={{
              position: "fixed",
              top: 0,
              left: sideW,
              width: `calc(100% - ${sideW})`,
              height: "68px",
              background: "rgba(255,255,255,0.95)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              zIndex: 40,
              backdropFilter: "blur(10px)",
              transition: "left 0.25s ease, width 0.25s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => setCollapsed((value) => !value)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--t2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2={collapsed ? "21" : "15"} y2="6" />
                  <line x1="3" y1="18" x2={collapsed ? "21" : "15"} y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {user?.role === "AGENCY_ADMIN" && brands.length > 0 ? (
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--t1)",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              ) : null}

              {user ? (
                <div ref={dropdownRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowDropdown((value) => !value)}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg,#5865f2,#818cf8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "14px",
                      boxShadow: "0 2px 8px rgba(88,101,242,0.25)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {(user.name || user.email)[0]?.toUpperCase()}
                  </button>

                  {showDropdown ? (
                    <div
                      style={{
                        position: "absolute",
                        top: "44px",
                        right: 0,
                        width: "220px",
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)", marginBottom: "2px" }}>{user.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.email}
                        </div>
                        <div style={{ fontSize: "10px", color: "#5865f2", fontWeight: 700, marginTop: "3px" }}>{user.role.replace("_", " ")}</div>
                      </div>
                      <button
                        onClick={logout}
                        style={{
                          width: "100%",
                          padding: "11px 14px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          color: "#f85149",
                          fontSize: "13px",
                          fontWeight: 600,
                          fontFamily: "inherit",
                          textAlign: "left",
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </header>

          <main style={{ flex: 1, paddingTop: "68px", background: "var(--bg)" }}>
            <div style={{ padding: "28px 24px", maxWidth: "1280px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>{children}</div>
          </main>
        </div>
    </div>
  );
}
