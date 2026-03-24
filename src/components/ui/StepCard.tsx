"use client";

import type { ReactNode } from "react";
import React from "react";

import { cardStyle } from "@/lib/styles";

interface StepCardProps {
  children: ReactNode;
  step: number;
  title: string;
}

export default function StepCard({
  children,
  step,
  title,
}: StepCardProps): React.ReactElement {
  return (
    <div style={{ ...cardStyle, padding: "28px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "8px",
            background: "linear-gradient(135deg,#5865f2,#818cf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {step}
        </div>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
