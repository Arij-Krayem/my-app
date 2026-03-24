"use client";

import React from "react";

interface StatBadgeProps {
  bg: string;
  border: string;
  color: string;
  count: number;
  label: string;
}

export default function StatBadge({
  bg,
  border,
  color,
  count,
  label,
}: StatBadgeProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 14px",
        borderRadius: "10px",
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 700, color }}>{count}</span>
      <span style={{ fontSize: "12px", color }}>{label}</span>
    </div>
  );
}
