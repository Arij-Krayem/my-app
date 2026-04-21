import type { CSSProperties } from "react";

export const pageEyebrowStyle: CSSProperties = {
  color: "var(--text-accent, #5b5ef4)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export const pageSubtitleStyle: CSSProperties = {
  marginTop: 0,
  color: "var(--text-muted, #6b7280)",
  fontSize: 14,
  lineHeight: 1.6,
};

export const cardStyle: CSSProperties = {
  background: "var(--card-bg, #ffffff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: 12,
  boxShadow: "var(--shadow-card, 0 1px 3px rgba(0,0,0,0.07))",
};

export const paddedCardStyle: CSSProperties = {
  ...cardStyle,
  padding: 18,
};

export const largeCardStyle: CSSProperties = {
  ...cardStyle,
  padding: 22,
};

export const metricCardStyle: CSSProperties = {
  ...cardStyle,
  padding: 18,
};

export const tableHeaderRowStyle: CSSProperties = {
  background: "#F5F5FF",
  borderBottom: "1px solid rgba(99,102,241,0.12)",
};

export const tableHeadingStyle: CSSProperties = {
  textAlign: "left",
  padding: "16px 18px",
  color: "#5b6178",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

export const tableCellStyle: CSSProperties = {
  padding: "18px",
  fontSize: 14,
  color: "#334155",
  borderBottom: "1px solid rgba(15,23,42,0.06)",
};

export const emptyStateWrapStyle: CSSProperties = {
  ...cardStyle,
  minHeight: 320,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "32px 20px",
};

export const emptyIconWrapStyle: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg,#f6f7ff,#ecefff)",
  color: "#6366F1",
  boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.14)",
  marginBottom: 18,
};

export const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 20,
  fontWeight: 700,
};

export const emptySubtitleStyle: CSSProperties = {
  marginTop: 10,
  maxWidth: 440,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

export const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 18px",
  borderRadius: 8,
  border: "none",
  background: "var(--primary, #5b5ef4)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 8px 18px rgba(91,94,244,0.16)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid var(--border, #e5e7eb)",
  background: "#fff",
  color: "var(--text-muted, #6b7280)",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const subtleInputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 8,
  border: "1px solid var(--border, #e5e7eb)",
  background: "#ffffff",
  color: "var(--text-primary, #0f0f0f)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

export function pillStyle(color: string, background: string, border: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    color,
    background,
    border: `1px solid ${border}`,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
  };
}
