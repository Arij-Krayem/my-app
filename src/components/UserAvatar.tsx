"use client";

import type { CSSProperties } from "react";

const FALLBACK_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9", "#8b5cf6"];

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  borderRadius?: number | string;
  fontSize?: number;
  colorIndex?: number;
  style?: CSSProperties;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  if (!source) return "?";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return parts.map(part => part[0]).join("").toUpperCase().slice(0, 2);
  }

  return source[0].toUpperCase();
}

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 40,
  borderRadius = 12,
  fontSize = Math.max(12, Math.round(size * 0.34)),
  colorIndex = 0,
  style,
}: UserAvatarProps) {
  const initials = getInitials(name, email);
  const color = FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length];
  const shared: CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    flexShrink: 0,
    ...style,
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? email ?? "User avatar"}
        style={{
          ...shared,
          objectFit: "cover",
          border: "1px solid var(--border)",
          background: "#fff",
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...shared,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: "#fff",
        fontWeight: 800,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}
