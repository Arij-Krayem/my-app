"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PENDING: { color: "#d29922", bg: "rgba(210,153,34,0.12)", border: "rgba(210,153,34,0.25)" },
  MAPPED: { color: "#5865f2", bg: "rgba(88,101,242,0.1)", border: "rgba(88,101,242,0.24)" },
  IMPORTED: { color: "#16a34a", bg: "rgba(22,163,74,0.1)", border: "rgba(22,163,74,0.24)" },
  FAILED: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.24)" },
};

type UploadItem = {
  id: string;
  fileName: string;
  platform: string;
  brand?: string | null;
  status: string;
  createdAt: string;
};

function PlatformBadge({ platform }: { platform: string }) {
  const isGoogle = platform === "GOOGLE";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: isGoogle ? "#2563eb" : "#1877F2",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          background: isGoogle ? "#4285F4" : "#1877F2",
          boxShadow: isGoogle
            ? "0 8px 16px rgba(66,133,244,0.18)"
            : "0 8px 16px rgba(24,119,242,0.18)",
        }}
      >
        {isGoogle ? "G" : "M"}
      </span>
      {isGoogle ? "Google Ads" : "Meta Ads"}
    </div>
  );
}

export default function UploadsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ items?: UploadItem[] }>("/api/uploads")
      .then((data) => {
        console.log("[uploads] response", data);
        setUploads(
          Array.isArray(data?.items)
            ? data.items.map((item) => ({
                ...item,
                brand: typeof (item as UploadItem & { brand?: { name?: string } }).brand === "object"
                  ? (item as UploadItem & { brand?: { name?: string } }).brand?.name ?? null
                  : item.brand ?? null,
              }))
            : [],
        );
      })
      .catch((fetchError) => {
        console.error("[uploads] Failed to load uploads", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load uploads");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: 280,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid rgba(99,102,241,0.12)",
            borderTopColor: "#6366F1",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
        >
        <div>
          <div
            style={{
              marginBottom: 8,
              color: "#6366F1",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Uploads
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--t2)" }}>
            Review upload history, monitor import status, and continue mappings when needed.
          </p>
        </div>

        <Link
          href="/uploads/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "11px 18px",
            borderRadius: 12,
            background: "linear-gradient(135deg,#5865f2,#7c83ff)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 12px 24px rgba(88,101,242,0.22)",
          }}
        >
          + New Upload
        </Link>
      </div>

      <section
        style={{
          background: "#fff",
          border: "1.5px solid rgba(99,102,241,0.4)",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(99,102,241,0.08)",
          padding: 18,
        }}
      >
        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.06)",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}
        {uploads.length === 0 ? (
          <div
            style={{
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "32px 16px",
            }}
          >
            <div
              style={{
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
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--t1)" }}>
              No uploads yet
            </h2>
            <p style={{ marginTop: 10, maxWidth: 420, fontSize: 14, color: "var(--t2)" }}>
              Bring in your first dataset to start validating mappings, tracking status, and powering the dashboard.
            </p>
            <Link
              href="/uploads/new"
              style={{
                marginTop: 22,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "11px 20px",
                borderRadius: 12,
                background: "linear-gradient(135deg,#5865f2,#7c83ff)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 10px 24px rgba(88,101,242,0.2)",
              }}
            >
              Upload your first dataset
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div
              style={{
                minWidth: 940,
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1.3fr 1.2fr 1fr 1.1fr 0.9fr",
                  gap: 12,
                  padding: "16px 18px",
                  background: "#F5F5FF",
                  borderBottom: "1px solid rgba(99,102,241,0.12)",
                }}
              >
                {["FILE NAME", "PLATFORM", "BRAND", "STATUS", "DATE", "ACTIONS"].map((heading) => (
                  <span
                    key={heading}
                    style={{
                      color: "#5b6178",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                    }}
                  >
                    {heading}
                  </span>
                ))}
              </div>

              {uploads.map((upload, index) => {
                const status = STATUS_CFG[upload.status] ?? STATUS_CFG.PENDING;
                const canMap = upload.status === "PENDING" || upload.status === "MAPPED";

                return (
                  <div
                    key={upload.id}
                    role={canMap ? "button" : undefined}
                    tabIndex={canMap ? 0 : -1}
                    onClick={() => canMap && router.push(`/uploads/${upload.id}/mapping`)}
                    onKeyDown={(event) => {
                      if (canMap && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        router.push(`/uploads/${upload.id}/mapping`);
                      }
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.2fr 1.3fr 1.2fr 1fr 1.1fr 0.9fr",
                      gap: 12,
                      alignItems: "center",
                      padding: "18px 18px",
                      borderBottom:
                        index < uploads.length - 1 ? "1px solid rgba(15,23,42,0.06)" : "none",
                      background: "#fff",
                      cursor: canMap ? "pointer" : "default",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f8f9ff",
                          color: "#6366F1",
                          border: "1px solid rgba(99,102,241,0.14)",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#111827",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {upload.fileName}
                        </div>
                        <div style={{ marginTop: 4, color: "var(--t2)", fontSize: 12 }}>
                          {canMap ? "Ready for mapping" : "Processed dataset"}
                        </div>
                      </div>
                    </div>

                    <PlatformBadge platform={upload.platform} />

                    <span style={{ color: "#334155", fontSize: 13, fontWeight: 500 }}>
                      {upload.brand || "Unassigned"}
                    </span>

                    <span
                      style={{
                        width: "fit-content",
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${status.border}`,
                        background: status.bg,
                        color: status.color,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {upload.status}
                    </span>

                    <span style={{ color: "var(--t2)", fontSize: 13 }}>
                      {new Date(upload.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    {canMap ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/uploads/${upload.id}/mapping`);
                        }}
                        style={{
                          width: "fit-content",
                          padding: "8px 12px",
                          borderRadius: 10,
                          border: "1px solid rgba(99,102,241,0.2)",
                          background: "rgba(99,102,241,0.08)",
                          color: "#4f46e5",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Map Columns
                      </button>
                    ) : (
                      <span style={{ color: "var(--t3)", fontSize: 12, fontWeight: 600 }}>
                        Complete
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
