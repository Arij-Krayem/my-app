"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DialogContent({ children, style }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className="dialog-content" style={style}>
        {children}
      </DialogPrimitive.Content>
      <style>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          z-index: 50;
          animation: fadeIn 150ms ease;
        }

        .dialog-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(90vw, 560px);
          max-height: min(90vh, 760px);
          overflow-y: auto;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          padding: 0;
          z-index: 51;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: scaleIn 150ms ease;
          outline: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </DialogPrimitive.Portal>
  );
}

interface DialogHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  onClose?: () => void;
}

export function DialogHeader({ icon, title, description, onClose }: DialogHeaderProps) {
  return (
    <div
      className="dialog-header"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "24px 24px 18px",
        borderBottom: "1px solid rgba(229,231,235,0.9)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
        {icon ? (
          <div
            className="dialog-icon"
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(91,94,244,0.1)",
              color: "var(--primary, #5b5ef4)",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <DialogPrimitive.Title
            className="dialog-title"
            style={{
              margin: 0,
              color: "var(--text-primary, #0f0f0f)",
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description
            className="dialog-description"
            style={{
              margin: "6px 0 0",
              color: "var(--text-muted, #6b7280)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {description ?? ""}
          </DialogPrimitive.Description>
        </div>
      </div>

      <DialogPrimitive.Close
        className="dialog-close"
        aria-label="Close dialog"
        onClick={onClose}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          border: "1px solid rgba(229,231,235,0.95)",
          background: "#fff",
          color: "#6b7280",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          fontSize: 20,
          lineHeight: 1,
          fontFamily: "inherit",
        }}
      >
        ×
      </DialogPrimitive.Close>
    </div>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function DialogFooter({ children, style }: DialogFooterProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        padding: "18px 24px 24px",
        borderTop: "1px solid rgba(229,231,235,0.9)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
