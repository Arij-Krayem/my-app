"use client";

import type { ReactNode } from "react";
import React from "react";

interface SectionHeaderProps {
  action?: ReactNode;
  subtitle?: string;
  title: string;
}

export default function SectionHeader({
  action,
  subtitle,
  title,
}: SectionHeaderProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "24px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--t1)", marginBottom: subtitle ? "4px" : 0 }}>
          {title}
        </h2>
        {subtitle ? <p style={{ fontSize: "14px", color: "var(--t2)" }}>{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
