"use client";

import * as React from "react";

import ModalOverlay from "@/components/ui/ModalOverlay";
import { btnSecondary, cardStyle } from "@/lib/styles";

interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Dialog({ open, onOpenChange, children }: DialogProps): React.ReactNode {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    if (open) document.addEventListener("keydown", handleKey);

    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return <ModalOverlay onClose={() => onOpenChange(false)}>{children}</ModalOverlay>;
}

interface DialogContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DialogContent({ children, style }: DialogContentProps): React.ReactElement {
  return (
    <div
      style={{
        ...cardStyle,
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 480,
        fontFamily: "'Outfit', sans-serif",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  description?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  title: string;
}

export function DialogHeader({
  description,
  icon,
  onClose,
  title,
}: DialogHeaderProps): React.ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon ? (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "rgba(88,101,242,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5865f2",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        ) : null}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h2>
          {description ? <p style={{ fontSize: 13, color: "#94a3b8", margin: "3px 0 0" }}>{description}</p> : null}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          ...btnSecondary,
          width: 30,
          height: 30,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 16,
          flexShrink: 0,
          marginLeft: 8,
        }}
      >
        ×
      </button>
    </div>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DialogFooter({ children, style }: DialogFooterProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 24,
        paddingTop: 20,
        borderTop: "1px solid #f1f5f9",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
