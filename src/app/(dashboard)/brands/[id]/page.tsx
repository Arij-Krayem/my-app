"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from "./page.module.css";

interface BrandMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface BrandUpload {
  id: number;
  fileName: string;
  platform: string;
  status: string;
  date: string;
}

interface BrandDetail {
  id: number;
  name: string;
  memberCount: number;
  uploadCount: number;
  lastActivity: string;
  health: string;
  metrics: {
    totalSpend: number;
    roas: number;
    ctr: number;
    cpc: number;
  };
  members: BrandMember[];
  uploads: BrandUpload[];
}

export default function BrandDetailPage() {
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== "AGENCY_ADMIN") {
        router.push("/dashboard");
        return;
      }
    }
    fetchBrandDetails();
  }, [brandId, router]);

  const fetchBrandDetails = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      const mockBrand: BrandDetail = {
        id: parseInt(brandId),
        name: "TechCorp",
        memberCount: 5,
        uploadCount: 12,
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        health: "HEALTHY",
        metrics: {
          totalSpend: 45230,
          roas: 3.8,
          ctr: 2.9,
          cpc: 1.45,
        },
        members: [
          { id: 1, name: "John Doe", email: "john@techcorp.com", role: "MARKETER" },
          { id: 2, name: "Jane Smith", email: "jane@techcorp.com", role: "MARKETER" },
          { id: 3, name: "Bob Johnson", email: "bob@techcorp.com", role: "MARKETER" },
        ],
        uploads: [
          { id: 1, fileName: "google_ads_june.csv", platform: "Google Ads", status: "IMPORTED", date: "2024-06-15" },
          { id: 2, fileName: "meta_ads_june.csv", platform: "Meta Ads", status: "IMPORTED", date: "2024-06-14" },
          { id: 3, fileName: "google_ads_may.csv", platform: "Google Ads", status: "IMPORTED", date: "2024-05-30" },
        ],
      };
      setBrand(mockBrand);
    } catch (error) {
      console.error("Failed to fetch brand details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (health: string) => {
    const healthConfig: Record<string, { class: string; text: string }> = {
      HEALTHY: { class: "badge-success", text: "HEALTHY" },
      WARNING: { class: "badge-warning", text: "WARNING" },
      CRITICAL: { class: "badge-danger", text: "CRITICAL" },
    };

    const config = healthConfig[health] || { class: "badge-info", text: health };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; text: string }> = {
      IMPORTED: { class: "badge-success", text: "IMPORTED" },
      PENDING: { class: "badge-warning", text: "PENDING" },
      FAILED: { class: "badge-danger", text: "FAILED" },
    };

    const config = statusConfig[status] || { class: "badge-info", text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`loading-spinner ${styles.loadingSpinner}`}></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className={styles.notFound}>
        <p className={styles.mutedText}>Brand not found.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/brands")}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${styles.backButton}`}
            >
              ← Back
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${styles.textStrong}`}>
                  {brand.name}
                </span>
                {getHealthBadge(brand.health)}
                <span className={`text-sm ${styles.mutedText}`}>
                  {brand.memberCount} members • {brand.uploadCount} uploads
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Spend", value: `$${brand.metrics.totalSpend.toLocaleString()}` },
            { label: "ROAS", value: `${brand.metrics.roas}x` },
            { label: "CTR", value: `${brand.metrics.ctr}%` },
            { label: "CPC", value: `$${brand.metrics.cpc}` },
          ].map(kpi => (
            <div key={kpi.label} className={styles.kpiCard}>
              <p className={styles.kpiLabel}>{kpi.label}</p>
              <p className={styles.kpiValue}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className={styles.tabsBorder}>
          <nav className="flex gap-6 px-6">
            {["overview", "members", "uploads"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors capitalize ${activeTab === tab ? styles.tabButtonActive : styles.tabButton}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <h3 className={styles.sectionTitle}>Overview</h3>
              <p className={styles.mutedText}>
                Brand overview and performance metrics would be displayed here.
              </p>
            </div>
          )}

          {activeTab === "members" && (
            <div>
              <h3 className={styles.sectionTitle}>Team Members</h3>
              <div className="space-y-3">
                {brand.members.map(member => (
                  <div key={member.id} className={`flex items-center justify-between ${styles.listItem}`}>
                    <div>
                      <p className={styles.itemTitle}>{member.name}</p>
                      <p className={styles.itemMeta}>{member.email}</p>
                    </div>
                    <span className="badge badge-info">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "uploads" && (
            <div>
              <h3 className={styles.sectionTitle}>Recent Uploads</h3>
              <div className="space-y-3">
                {brand.uploads.map(upload => (
                  <div key={upload.id} className={`flex items-center justify-between ${styles.listItem}`}>
                    <div>
                      <p className={styles.itemTitle}>{upload.fileName}</p>
                      <p className={styles.itemMeta}>{upload.platform} • {upload.date}</p>
                    </div>
                    {getStatusBadge(upload.status)}
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
