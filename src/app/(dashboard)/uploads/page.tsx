"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING:  { color: "#d29922", bg: "rgba(210,153,34,0.1)", border: "rgba(210,153,34,0.25)" },
  MAPPED:   { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.25)" },
  IMPORTED: { color: "#3fb950", bg: "rgba(63,185,80,0.1)",  border: "rgba(63,185,80,0.25)"  },
  FAILED:   { color: "#f85149", bg: "rgba(248,81,73,0.1)",  border: "rgba(248,81,73,0.25)"  },
};

export default function UploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    fetch("/api/uploads", { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(d => setUploads(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Uploads</h1>
          <p style={{ fontSize: "14px", color: "var(--t2)" }}>Manage your CSV data uploads</p>
        </div>
        <Link href="/uploads/new" style={{ padding: "10px 20px", background: "linear-gradient(135deg,#5865f2,#818cf8)", borderRadius: "10px", color: "white", fontWeight: "600", fontSize: "14px", textDecoration: "none", boxShadow: "0 4px 14px rgba(88,101,242,0.3)" }}>
          + New Upload
        </Link>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 120px 120px 110px 120px 110px", padding: "13px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
          {["File Name","Platform","Brand","Status","Date","Actions"].map(h => (
            <span key={h} style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {uploads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px" }}>
            <div style={{ color: "var(--t3)", display: "flex", justifyContent: "center", marginBottom: "14px" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "6px" }}>No uploads yet</p>
            <p style={{ fontSize: "14px", color: "var(--t2)", marginBottom: "20px" }}>Upload your first CSV dataset to start monitoring</p>
            <Link href="/uploads/new" style={{ padding: "10px 22px", background: "linear-gradient(135deg,#5865f2,#818cf8)", borderRadius: "10px", color: "white", fontWeight: "600", fontSize: "14px", textDecoration: "none", boxShadow: "0 4px 14px rgba(88,101,242,0.3)" }}>
              Upload your first dataset
            </Link>
          </div>
        ) : (
          uploads.map((u, i) => {
            const sc = STATUS_CFG[u.status] ?? STATUS_CFG.PENDING;
            const canMap = u.status === "PENDING" || u.status === "MAPPED";
            return (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 120px 120px 110px 120px 110px", padding: "15px 24px", alignItems: "center", gap: "8px", borderBottom: i < uploads.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s", cursor: canMap ? "pointer" : "default" }}
                onClick={() => canMap && (window.location.href = `/uploads/${u.id}/mapping`)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(88,101,242,0.02)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.fileName}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600", color: u.platform === "GOOGLE" ? "#4285F4" : "#1877F2" }}>{u.platform === "GOOGLE" ? "Google Ads" : "Meta Ads"}</span>
                <span style={{ fontSize: "13px", color: "var(--t2)" }}>{u.brand || "—"}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, display: "inline-block" }}>{u.status}</span>
                <span style={{ fontSize: "13px", color: "var(--t2)" }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                {canMap ? (
                  <button onClick={e => { e.stopPropagation(); window.location.href = `/uploads/${u.id}/mapping`; }}
                    style={{ fontSize: "12px", fontWeight: "600", color: "#5865f2", background: "rgba(88,101,242,0.08)", border: "1px solid rgba(88,101,242,0.25)", borderRadius: "8px", padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    Map Columns
                  </button>
                ) : <span />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}