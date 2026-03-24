"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import EmptyState from "@/components/ui/EmptyState";
import { btnPrimary, cardStyle, tableHeaderStyle, tableRowStyle } from "@/lib/styles";

interface UploadRecord {
  brand?: string;
  createdAt: string;
  fileName: string;
  id: string;
  platform: "GOOGLE" | "META";
  status: "FAILED" | "IMPORTED" | "MAPPED" | "PENDING";
}

const STATUS_CONFIG: Record<UploadRecord["status"], { bg: string; border: string; color: string }> = {
  PENDING: { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  MAPPED: { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
  IMPORTED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)", border: "rgba(63,185,80,0.25)" },
  FAILED: { color: "#f85149", bg: "rgba(248,81,73,0.1)", border: "rgba(248,81,73,0.25)" },
};

export default function UploadsPage(): React.ReactElement {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(sessionStorage.getItem("access_token"));
  });

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    fetch("/api/uploads", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setUploads(Array.isArray(data) ? (data as UploadRecord[]) : []))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
        <Link href="/uploads/new" style={{ ...btnPrimary, textDecoration: "none" }}>
          + New Upload
        </Link>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 120px 120px 110px 120px 110px", padding: "13px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
          {["File Name", "Platform", "Brand", "Status", "Date", "Actions"].map((header) => (
            <span key={header} style={tableHeaderStyle}>
              {header}
            </span>
          ))}
        </div>

        {uploads.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              title="No uploads yet"
              subtitle="Upload your first CSV dataset to start monitoring."
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              }
            />
          </div>
        ) : (
          uploads.map((upload, index) => {
            const status = STATUS_CONFIG[upload.status];
            const canMap = upload.status === "PENDING" || upload.status === "MAPPED";

            return (
              <div
                key={upload.id}
                style={{
                  ...tableRowStyle,
                  display: "grid",
                  gridTemplateColumns: "2fr 120px 120px 110px 120px 110px",
                  padding: "15px 24px",
                  alignItems: "center",
                  gap: "8px",
                  borderBottom: index < uploads.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: canMap ? "pointer" : "default",
                }}
                onClick={() => {
                  if (canMap) window.location.href = `/uploads/${upload.id}/mapping`;
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "rgba(88,101,242,0.02)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upload.fileName}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: upload.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                  {upload.platform === "GOOGLE" ? "Google Ads" : "Meta Ads"}
                </span>
                <span style={{ fontSize: "13px", color: "var(--t2)" }}>{upload.brand || "-"}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", background: status.bg, color: status.color, border: `1px solid ${status.border}`, display: "inline-block" }}>
                  {upload.status}
                </span>
                <span style={{ fontSize: "13px", color: "var(--t2)" }}>{new Date(upload.createdAt).toLocaleDateString()}</span>
                {canMap ? (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      window.location.href = `/uploads/${upload.id}/mapping`;
                    }}
                    style={{ padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(88,101,242,0.25)", background: "rgba(88,101,242,0.08)", color: "#5865f2", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Map Columns
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
