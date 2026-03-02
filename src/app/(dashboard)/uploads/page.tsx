"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch("/api/uploads", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUploads(data);
      }
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; text: string }> = {
      PENDING: { class: "badge-warning", text: "PENDING" },
      MAPPED: { class: "badge-info", text: "MAPPED" },
      IMPORTED: { class: "badge-success", text: "IMPORTED" },
      FAILED: { class: "badge-danger", text: "FAILED" },
    };

    const config = statusConfig[status] || { class: "badge-warning", text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" style={{ width: "40px", height: "40px" }}></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--t1)" }}>
          Uploads
        </h1>
        <a
          href="/uploads/new"
          className="btn-primary"
        >
          New Upload
        </a>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>File Name</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Platform</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Brand</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Status</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Date</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length > 0 ? (
                uploads.map((upload) => (
                  <tr
                    key={upload.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid var(--border)` }}
                    onClick={() => {
                      if (upload.status === "PENDING" || upload.status === "MAPPED") {
                        window.location.href = `/uploads/${upload.id}/mapping`;
                      }
                    }}
                  >
                    <td className="p-4" style={{ color: "var(--t1)" }}>
                      {upload.fileName}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${upload.platform === "Google Ads" ? "badge-info" : "badge-success"}`}>
                        {upload.platform}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: "var(--t2)" }}>
                      {upload.brand}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(upload.status)}
                    </td>
                    <td className="p-4" style={{ color: "var(--t2)" }}>
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {(upload.status === "PENDING" || upload.status === "MAPPED") && (
                        <button
                          className="text-sm font-medium hover:underline"
                          style={{ color: "var(--accent)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/uploads/${upload.id}/mapping`;
                          }}
                        >
                          Map Columns
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: "var(--t3)" }}>
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-lg mb-2">No uploads yet</p>
                    <a
                      href="/uploads/new"
                      className="btn-primary"
                    >
                      Upload your first dataset
                    </a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
