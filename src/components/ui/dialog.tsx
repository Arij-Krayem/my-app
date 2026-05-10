"use client"

import * as React from "react"
import styles from "./dialog.module.css"

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
    <div className={styles.root}>
      <div onClick={() => onOpenChange(false)} className={styles.overlay} />
      {children}
    </div>
  )
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={`${styles.content} ${className ?? ""}`}>
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
    <div className={styles.header}>
      <div className={styles.headerMain}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>
      <button onClick={onClose} className={styles.closeButton}>&times;</button>
    </div>
  )
}

interface DialogFooterProps {
  children: React.ReactNode
}

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div className={styles.footer}>
      {children}
    </div>
  )
}
