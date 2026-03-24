"use client";

import type { ReactNode } from "react";
import React, { useEffect } from "react";

import { cardStyle } from "@/lib/styles";

interface ModalOverlayProps {
  children: ReactNode;
  maxWidth?: number;
  onClose: () => void;
}

export default function ModalOverlay({
  children,
  maxWidth = 480,
  onClose,
}: ModalOverlayProps): React.ReactElement {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15,18,40,0.4)",
      }}
    >
      <div
        style={{
          ...cardStyle,
          position: "relative",
          width: "100%",
          maxWidth,
          margin: "0 auto",
          padding: "28px 28px 24px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
