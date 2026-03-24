"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { AVATAR_COLORS, BRANDS } from "@/lib/constants";
import {
  avatarStyle,
  badgeStyle,
  btnPrimary,
  btnSecondary,
  cardStyle,
  inputStyle,
  labelStyle,
  tableHeaderStyle,
  tableRowStyle,
} from "@/lib/styles";

type BrandHealth = "ALL" | "CRITICAL" | "HEALTHY" | "WARNING";

interface BrandRecord {
  color: string;
  health: "HEALTHY" | "WARNING" | "CRITICAL";
  id: number;
  lastActivity: string;
  members: number;
  name: string;
  roas: number;
  spend: string;
  uploads: number;
}

const HEALTH_CONFIG: Record<Exclude<BrandHealth, "ALL">, { bg: string; border: string; color: string; dot: string }> = {
  HEALTHY: { color: "#16a34a", bg: "rgba(22,163,74,.08)", border: "rgba(22,163,74,.2)", dot: "#16a34a" },
  WARNING: { color: "#d97706", bg: "rgba(217,119,6,.08)", border: "rgba(217,119,6,.2)", dot: "#d97706" },
  CRITICAL: { color: "#dc2626", bg: "rgba(220,38,38,.08)", border: "rgba(220,38,38,.2)", dot: "#dc2626" },
};

function BriefcaseIcon(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

export default function BrandsPage(): React.ReactElement {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandRecord[]>(BRANDS);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BrandHealth>("ALL");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredBrands = useMemo(
    () =>
      brands.filter(
        (brand) =>
          (filter === "ALL" || brand.health === filter) &&
          brand.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [brands, filter, search],
  );

  const notify = (text: string): void => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const handleCreate = (): void => {
    if (!name.trim()) return;

    setSaving(true);
    window.setTimeout(() => {
      setBrands((current) => [
        ...current,
        {
          id: Date.now(),
          name: name.trim(),
          members: 0,
          uploads: 0,
          health: "HEALTHY",
          roas: 0,
          spend: "$0",
          lastActivity: "Just now",
          color: AVATAR_COLORS[current.length % AVATAR_COLORS.length],
        },
      ]);
      setSaving(false);
      setOpen(false);
      setName("");
      notify("Brand created successfully");
    }, 600);
  };

  const stats = [
    { label: "Total", value: brands.length, color: "#5865f2" },
    { label: "Healthy", value: brands.filter((brand) => brand.health === "HEALTHY").length, color: "#16a34a" },
    { label: "Warning", value: brands.filter((brand) => brand.health === "WARNING").length, color: "#d97706" },
    { label: "Critical", value: brands.filter((brand) => brand.health === "CRITICAL").length, color: "#dc2626" },
  ];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader
        title="Client Workspaces"
        subtitle="Search, filter, and open each brand workspace from one place."
        action={
          <button onClick={() => setOpen(true)} style={btnPrimary}>
            + New Brand
          </button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, padding: "18px 22px" }}>
            <div style={{ fontSize: 12, color: "var(--t2)", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {message ? (
        <div
          style={{
            background: "rgba(22,163,74,.08)",
            border: "1px solid rgba(22,163,74,.25)",
            borderRadius: 9,
            padding: "10px 16px",
            marginBottom: 16,
            color: "#16a34a",
            fontSize: 14,
          }}
        >
          {message}
        </div>
      ) : null}

      <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--t3)",
                display: "flex",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              style={{ ...inputStyle, paddingLeft: 34 }}
              placeholder="Search brands..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["ALL", "HEALTHY", "WARNING", "CRITICAL"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  ...(filter === value ? btnPrimary : btnSecondary),
                  padding: "7px 14px",
                  fontSize: 13,
                  boxShadow: filter === value ? "none" : undefined,
                }}
              >
                {value === "ALL" ? "All" : value.charAt(0) + value.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9", background: "var(--bg)" }}>
              {["Brand", "Members", "Uploads", "Health", "Spend", "ROAS", "Actions"].map((header) => (
                <th key={header} style={tableHeaderStyle}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand, index) => {
                const healthConfig = HEALTH_CONFIG[brand.health];
                const color = brand.color ?? AVATAR_COLORS[index % AVATAR_COLORS.length];

                return (
                  <tr
                    key={brand.id}
                    style={{
                      ...tableRowStyle,
                      borderBottom: index < filteredBrands.length - 1 ? "1px solid #f1f5f9" : "none",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ ...avatarStyle, background: color }}>{brand.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{brand.name}</div>
                          <div style={{ fontSize: 12, color: "var(--t3)" }}>Active {brand.lastActivity}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--t2)", fontSize: 14 }}>{brand.members}</td>
                    <td style={{ padding: "14px 16px", color: "var(--t2)", fontSize: 14 }}>{brand.uploads}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ ...badgeStyle, background: healthConfig.bg, color: healthConfig.color, border: `1px solid ${healthConfig.border}` }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: healthConfig.dot }} />
                        {brand.health}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14 }}>{brand.spend}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14, color: brand.roas >= 2 ? "#16a34a" : "#dc2626" }}>
                      {brand.roas.toFixed(1)}x
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => router.push(`/brands/${brand.id}`)} style={{ ...btnSecondary, padding: "7px 16px", fontSize: 13 }}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 20 }}>
                  <EmptyState
                    title="No brands found"
                    subtitle="Try adjusting your search or filter."
                    icon={
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                      </svg>
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader icon={<BriefcaseIcon />} title="New Brand" description="Create a new client workspace" onClose={() => setOpen(false)} />
          <div>
            <label style={labelStyle}>Brand Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. TechCorp"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCreate();
              }}
              autoFocus
            />
            <p style={{ fontSize: 12, color: "var(--t3)", margin: "8px 0 0" }}>A new workspace will be created for this brand.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} style={btnSecondary}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ ...btnPrimary, opacity: saving || !name.trim() ? 0.6 : 1 }}>
              {saving ? "Creating..." : "Create Brand"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
