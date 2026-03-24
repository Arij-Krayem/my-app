"use client";

import type { ReactNode } from "react";
import React from "react";

import { cardStyle } from "@/lib/styles";

interface EmptyStateProps {
  icon?: ReactNode;
  subtitle?: string;
  title: string;
}

export default function EmptyState({
  icon,
  subtitle,
  title,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      style={{
        ...cardStyle,
        textAlign: "center",
        padding: "64px 20px",
      }}
    >
      {icon ? (
        <div style={{ color: "var(--t3)", display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          {icon}
        </div>
      ) : null}
      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--t1)", marginBottom: subtitle ? "6px" : 0 }}>
        {title}
      </p>
      {subtitle ? <p style={{ fontSize: "14px", color: "var(--t2)" }}>{subtitle}</p> : null}
    </div>
  );
}
