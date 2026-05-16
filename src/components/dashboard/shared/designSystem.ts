import type { CSSProperties } from "react";

export const pageEyebrowStyle: CSSProperties = {
  color: "#6366F1",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 30,
  fontWeight: 700,
};

export const pageSubtitleStyle: CSSProperties = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
};

export const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(148,163,184,0.24)",
  borderRadius: 14,
  boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
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
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#5865f2,#7c83ff)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 12px 24px rgba(88,101,242,0.22)",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const secondaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#fff",
  color: "#475569",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export const subtleInputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 10,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "#f8fafc",
  color: "#0f172a",
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
