import { createElement, type ReactElement, type SVGProps } from "react";

export const SIDEBAR_WIDTHS = {
  collapsed: 68,
  expanded: 230,
} as const;

type BrandHealth = "HEALTHY" | "WARNING" | "CRITICAL";

export interface NavItem {
  adminOnly?: boolean;
  href: string;
  icon: ReactElement;
  id: string;
  label: string;
}

export interface BrandSummary {
  color: string;
  health: BrandHealth;
  id: number;
  lastActivity: string;
  members: number;
  name: string;
  roas: number;
  spend: string;
  uploads: number;
}

const svgProps: SVGProps<SVGSVGElement> = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const createIcon = (...children: ReactElement[]): ReactElement =>
  createElement("svg", svgProps, ...children);

const path = (d: string): ReactElement => createElement("path", { d });
const line = (x1: number, y1: number, x2: number, y2: number): ReactElement =>
  createElement("line", { x1, y1, x2, y2 });
const rect = (x: number, y: number, width: number, height: number): ReactElement =>
  createElement("rect", { x, y, width, height });
const circle = (cx: number, cy: number, r: number): ReactElement =>
  createElement("circle", { cx, cy, r });
const polyline = (points: string): ReactElement => createElement("polyline", { points });

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: createIcon(rect(3, 3, 7, 7), rect(14, 3, 7, 7), rect(3, 14, 7, 7), rect(14, 14, 7, 7)),
  },
  {
    id: "uploads",
    href: "/uploads",
    label: "Uploads",
    icon: createIcon(path("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), polyline("17 8 12 3 7 8"), line(12, 3, 12, 15)),
  },
  {
    id: "alerts",
    href: "/alerts",
    label: "Alerts",
    icon: createIcon(path("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"), line(12, 9, 12, 13), line(12, 17, 12.01, 17)),
  },
  {
    id: "guardrails",
    href: "/guardrails",
    label: "Guardrails",
    icon: createIcon(path("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z")),
  },
  {
    id: "anomalies",
    href: "/anomalies",
    label: "Anomalies",
    icon: createIcon(polyline("22 12 18 12 15 21 9 3 6 12 2 12")),
  },
  {
    id: "settings",
    href: "/settings",
    label: "Settings",
    icon: createIcon(circle(12, 12, 3), path("M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z")),
  },
  {
    id: "brands",
    href: "/brands",
    label: "Brands",
    adminOnly: true,
    icon: createIcon(path("M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"), line(7, 7, 7.01, 7)),
  },
  {
    id: "users",
    href: "/users",
    label: "Users",
    adminOnly: true,
    icon: createIcon(path("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"), circle(9, 7, 4), path("M23 21v-2a4 4 0 0 0-3-3.87"), path("M16 3.13a4 4 0 0 1 0 7.75")),
  },
  {
    id: "detection",
    href: "/detection",
    label: "Detection",
    adminOnly: true,
    icon: createIcon(path("M2 12h2l3-9 4 18 3-9h2")),
  },
];

export const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9", "#8b5cf6"];

export const BRANDS: BrandSummary[] = [
  { id: 1, name: "TechCorp", color: "#5865f2", members: 4, uploads: 12, health: "HEALTHY", roas: 4.2, spend: "$24,500", lastActivity: "2h ago" },
  { id: 2, name: "RetailMax", color: "#d29922", members: 2, uploads: 8, health: "WARNING", roas: 1.8, spend: "$18,200", lastActivity: "1d ago" },
  { id: 3, name: "ServicePro", color: "#f85149", members: 6, uploads: 20, health: "CRITICAL", roas: 1.4, spend: "$31,000", lastActivity: "3h ago" },
  { id: 4, name: "NovaBrand", color: "#0ea5e9", members: 3, uploads: 4, health: "HEALTHY", roas: 3.9, spend: "$9,800", lastActivity: "5d ago" },
  { id: 5, name: "ZenMedia", color: "#8b5cf6", members: 4, uploads: 9, health: "WARNING", roas: 2.1, spend: "$15,600", lastActivity: "12h ago" },
];

export const PLATFORM_OPTIONS = [
  {
    value: "Google Ads",
    label: "Google Ads",
    desc: "Search and campaign exports",
    initial: "G",
    color: "#4285F4",
    bg: "rgba(66,133,244,0.08)",
    border: "rgba(66,133,244,0.35)",
  },
  {
    value: "Meta Ads",
    label: "Meta Ads",
    desc: "Facebook and Instagram exports",
    initial: "f",
    color: "#1877F2",
    bg: "rgba(24,119,242,0.08)",
    border: "rgba(24,119,242,0.35)",
  },
] as const;

export const BRAND_LIST = BRANDS.map((brand) => brand.name);
export const BRAND_OPTIONS = BRAND_LIST;
