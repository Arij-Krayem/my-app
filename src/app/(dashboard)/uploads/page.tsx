"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface Upload {
  id: string;
  fileName: string;
  platform: string;
  brand?: string | null;
  status: string;
  createdAt: string;
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: styles.statusPending,
  MAPPED: styles.statusMapped,
  IMPORTED: styles.statusImported,
  FAILED: styles.statusFailed,
};

export default function UploadsPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    fetch("/api/uploads", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setUploads(d.items ?? (Array.isArray(d) ? d : [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.loadingShell}>
      <div className={styles.loader} />
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
              <Link href="/uploads/new" className="btn-primary">Upload your dataset</Link>
            </div>
          </div>
        ) : (
          <>
            <div className={`${styles.tableGrid} ${styles.tableHeader}`}>
              {["File Name", "Platform", "Brand", "Status", "Date", "Actions"].map(h => (
                <span key={h} className={styles.headerCell}>{h}</span>
              ))}
            </div>

            {uploads.map(u => {
              const canMap = u.status === "PENDING" || u.status === "MAPPED";
              const platformClass = u.platform === "GOOGLE" ? styles.platformGoogle : styles.platformMeta;
              return (
                <div
                  key={u.id}
                  className={`${styles.tableGrid} ${styles.uploadRow} ${canMap ? styles.uploadRowClickable : ""}`}
                  onClick={() => canMap && (window.location.href = `/uploads/${u.id}/mapping`)}
                >
                  <div className={styles.fileCell}>
                    <div className={styles.fileIcon}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <span className={styles.fileName}>{u.fileName}</span>
                  </div>

                  <span className={`${styles.platform} ${platformClass}`}>
                    {u.platform === "GOOGLE" ? "Google Ads" : "Meta Ads"}
                  </span>
                  <span className={styles.mutedCell}>{u.brand || "—"}</span>
                  <span className={`${styles.statusBadge} ${STATUS_CLASS[u.status] ?? styles.statusPending}`}>
                    {u.status}
                  </span>
                  <span className={styles.mutedCell}>{new Date(u.createdAt).toLocaleDateString()}</span>

                  {canMap ? (
                    <button
                      onClick={e => { e.stopPropagation(); window.location.href = `/uploads/${u.id}/mapping`; }}
                      className={styles.mapButton}
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
