"use client"
import * as React from "react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={() => onOpenChange(false)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,18,40,0.35)" }} />
      {children}
    </div>
  )
}

interface DialogContentProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function DialogContent({ children, style }: DialogContentProps) {
  return (
    <div style={{
      position: "relative", zIndex: 1,
      background: "#ffffff",
      borderRadius: 16,
      padding: "28px 28px 24px",
      width: "100%", maxWidth: 480,
      margin: "0 16px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
      fontFamily: "'Outfit', sans-serif",
      maxHeight: "90vh", overflowY: "auto",
      ...style,
    }}>
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  icon?: React.ReactNode
  title: string
  description?: string
  onClose: () => void
}

export function DialogHeader({ icon, title, description, onClose }: DialogHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon && (
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: "rgba(88,101,242,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#5865f2", flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h2>
          {description && <p style={{ fontSize: 13, color: "#94a3b8", margin: "3px 0 0" }}>{description}</p>}
        </div>
      </div>
      <button onClick={onClose} style={{
        width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0",
        background: "#f8fafc", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#94a3b8",
        fontSize: 16, flexShrink: 0, marginLeft: 8,
      }}>✕</button>
    </div>
  )
}

interface DialogFooterProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function DialogFooter({ children, style }: DialogFooterProps) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", gap: 10,
      marginTop: 24, paddingTop: 20, borderTop: "1px solid #f1f5f9",
      ...style,
    }}>
      {children}
    </div>
  )
}