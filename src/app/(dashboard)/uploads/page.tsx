"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)",  border: "rgba(210,153,34,0.25)"  },
  MAPPED:   { color: "#5865f2", bg: "rgba(88,101,242,0.1)",  border: "rgba(88,101,242,0.25)"  },
  IMPORTED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)",   border: "rgba(63,185,80,0.25)"   },
  FAILED:   { color: "#f85149", bg: "rgba(248,81,73,0.1)",   border: "rgba(248,81,73,0.25)"   },
};

export default function UploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    fetch("/api/uploads", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.ok ? r.json() : { items: [] })
      // ✅ FIX: API returns { items: [...] } not a plain array
      .then(d => setUploads(d.items ?? (Array.isArray(d) ? d : [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">UPLOADS</div>
          <h1 className="dashboard-title">Dataset Uploads</h1>
          <p className="dashboard-subtitle">Review upload history, monitor import status, and continue mappings when needed.</p>
        </div>
        <div className="dashboard-toolbar dashboard-toolbar-end">
          <Link href="/uploads/new" className="btn-primary">+ New Upload</Link>
        </div>
      </div>

      <div className="dashboard-table-card">
        {uploads.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="dashboard-empty-title">No uploads yet</div>
            <div className="dashboard-empty-subtitle">
              Bring in your first dataset to start validating mappings, tracking status, and powering the dashboard.
            </div>
            <div className="dashboard-empty-action">
              {/* ✅ FIX: updated button text */}
              <Link href="/uploads/new" className="btn-primary">Upload your dataset</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 120px 140px 110px 120px 120px", padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid var(--border)", gap: "8px" }}>
              {["File Name", "Platform", "Brand", "Status", "Date", "Actions"].map(h => (
                <span key={h} style={{ fontSize: "11px", fontWeight: "800", color: "var(--t3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {uploads.map((u, i) => {
              const sc     = STATUS_CFG[u.status] ?? STATUS_CFG.PENDING;
              const canMap = u.status === "PENDING" || u.status === "MAPPED";
              return (
                <div
                  key={u.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 120px 140px 110px 120px 120px", padding: "16px 24px", alignItems: "center", gap: "8px", borderBottom: i < uploads.length - 1 ? "1px solid var(--border)" : "none", cursor: canMap ? "pointer" : "default" }}
                  onClick={() => canMap && (window.location.href = `/uploads/${u.id}/mapping`)}
                >
                  {/* File name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0, background: "#f8fafc", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.fileName}
                    </span>
                  </div>

                  {/* Platform */}
                  <span style={{ fontSize: "13px", fontWeight: "700", color: u.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>
                    {u.platform === "GOOGLE" ? "Google Ads" : "Meta Ads"}
                  </span>

                  {/* Brand */}
                  <span style={{ fontSize: "13px", color: "var(--t2)" }}>{u.brand || "—"}</span>

                  {/* Status badge */}
                  <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "999px", background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, display: "inline-block", width: "fit-content" }}>
                    {u.status}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: "13px", color: "var(--t2)" }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>

                  {/* Action */}
                  {canMap ? (
                    <button
                      onClick={e => { e.stopPropagation(); window.location.href = `/uploads/${u.id}/mapping`; }}
                      style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent)", background: "#eef2ff", border: "1px solid rgba(88,101,242,0.18)", borderRadius: "10px", padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Map Columns
                    </button>
                  ) : <span />}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}