"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type BrandRecord = {
  id: string;
  name: string;
  createdAt: string;
};

type MemberRecord = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

type UploadRecord = {
  id: string;
  fileName: string;
  platform: string;
  status: string;
  createdAt: string;
};

type AlertRecord = {
  id: string;
  status: string;
};

type BrandDetailState = {
  brand: BrandRecord;
  members: MemberRecord[];
  uploads: UploadRecord[];
  alerts: AlertRecord[];
  metrics: {
    totalSpend: number;
    avgRoas: number;
    avgCtr: number;
    avgCpc: number;
  };
};

function healthFromMetrics(roas: number, openAlerts: number) {
  if (openAlerts > 0 && roas < 1.5) return "CRITICAL";
  if (openAlerts > 0 || roas < 2) return "WARNING";
  return "HEALTHY";
}

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const brandId = params.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<BrandDetailState | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== "AGENCY_ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [router]);

  useEffect(() => {
    if (!brandId) return;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [brandsRes, membersRes, uploadsRes, alertsRes, kpisRes] = await Promise.all([
          apiFetch<{ items?: BrandRecord[] }>("/api/brands"),
          apiFetch<{ items?: MemberRecord[] }>(`/api/brands/${brandId}/members`),
          apiFetch<{ items?: UploadRecord[] }>(`/api/uploads?brandId=${brandId}&pageSize=10`),
          apiFetch<{ items?: AlertRecord[] }>(`/api/alerts?brandId=${brandId}&status=OPEN`),
          apiFetch<{ kpis?: { totalSpend?: number; avgRoas?: number; avgCtr?: number; avgCpc?: number } }>(
            `/api/analytics/kpis?brandId=${brandId}`
          ),
        ]);

        const brand = (brandsRes.items ?? []).find((item) => item.id === brandId);

        if (!brand) {
          setDetail(null);
          setError("Brand not found");
          return;
        }

        setDetail({
          brand,
          members: membersRes.items ?? [],
          uploads: uploadsRes.items ?? [],
          alerts: alertsRes.items ?? [],
          metrics: {
            totalSpend: Number(kpisRes.kpis?.totalSpend ?? 0),
            avgRoas: Number(kpisRes.kpis?.avgRoas ?? 0),
            avgCtr: Number(kpisRes.kpis?.avgCtr ?? 0),
            avgCpc: Number(kpisRes.kpis?.avgCpc ?? 0),
          },
        });
      } catch (fetchError) {
        console.error("[brand-detail] Failed to load brand detail", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load brand");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [brandId]);

  const health = useMemo(() => {
    if (!detail) return "HEALTHY";
    return healthFromMetrics(detail.metrics.avgRoas, detail.alerts.length);
  }, [detail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" style={{ width: "40px", height: "40px" }} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--t2)" }}>{error || "Brand not found."}</p>
        <Link href="/brands" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
          Back to brands
        </Link>
      </div>
    );
  }

  const statusBadgeClass =
    health === "CRITICAL" ? "badge-danger" : health === "WARNING" ? "badge-warning" : "badge-success";

  return (
    <div className="animate-fadeUp">
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/brands")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: "var(--t1)" }}
            >
              Back
            </button>
            <div>
              <div style={{ color: "var(--primary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "8px" }}>
                Brands
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${statusBadgeClass}`}>{health}</span>
                <span className="text-sm" style={{ color: "var(--t2)" }}>
                  {detail.members.length} members • {detail.uploads.length} uploads
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>Total Spend</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              ${detail.metrics.totalSpend.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>ROAS</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              {detail.metrics.avgRoas.toFixed(2)}x
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>CTR</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              {detail.metrics.avgCtr.toFixed(2)}%
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>CPC</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              ${detail.metrics.avgCpc.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="border-b" style={{ borderColor: "var(--border)" }}>
          <nav className="flex gap-6 px-6">
            {["overview", "members", "uploads"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors capitalize ${
                  activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent hover:text-gray-600"
                }`}
                style={{
                  borderBottomColor: activeTab === tab ? "var(--accent)" : "transparent",
                  color: activeTab === tab ? "var(--accent)" : "var(--t2)",
                }}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
                Overview
              </h3>
              <p style={{ color: "var(--t2)" }}>
                Created{" "}
                {new Date(detail.brand.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                . {detail.alerts.length} open alerts currently linked to this brand.
              </p>
            </div>
          )}

          {activeTab === "members" && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
                Team Members
              </h3>
              <div className="space-y-3">
                {detail.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: "var(--t1)" }}>
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm" style={{ color: "var(--t2)" }}>
                        {member.user.email}
                      </p>
                    </div>
                    <span className="badge badge-info">{member.user.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "uploads" && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
                Recent Uploads
              </h3>
              <div className="space-y-3">
                {detail.uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: "var(--t1)" }}>
                        {upload.fileName}
                      </p>
                      <p className="text-sm" style={{ color: "var(--t2)" }}>
                        {upload.platform} •{" "}
                        {new Date(upload.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="badge badge-info">{upload.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
