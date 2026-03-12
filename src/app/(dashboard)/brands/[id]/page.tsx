"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function BrandDetailPage() {
  const [brand, setBrand] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  useEffect(() => {
    // Check if user is admin
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
      // Mock data for now
      const mockBrand = {
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
        <div className="loading-spinner" style={{ width: "40px", height: "40px" }}></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--t2)" }}>Brand not found.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      {/* Brand Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/brands")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: "var(--t1)" }}
            >
              ← Back
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--t1)" }}>
                {brand.name}
              </h1>
              <div className="flex items-center gap-3">
                {getHealthBadge(brand.health)}
                <span className="text-sm" style={{ color: "var(--t2)" }}>
                  {brand.memberCount} members • {brand.uploadCount} uploads
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>Total Spend</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              ${brand.metrics.totalSpend.toLocaleString()}
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>ROAS</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              {brand.metrics.roas}x
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>CTR</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              {brand.metrics.ctr}%
            </p>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--bg)" }}>
            <p className="text-sm mb-1" style={{ color: "var(--t3)" }}>CPC</p>
            <p className="text-xl font-bold" style={{ color: "var(--t1)" }}>
              ${brand.metrics.cpc}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b" style={{ borderColor: "var(--border)" }}>
          <nav className="flex gap-6 px-6">
            {["overview", "members", "uploads"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent hover:text-gray-600"
                }`}
                style={{
                  borderBottomColor: activeTab === tab ? "var(--accent)" : "transparent",
                  color: activeTab === tab ? "var(--accent)" : "var(--t2)"
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
                Brand overview and performance metrics would be displayed here.
              </p>
            </div>
          )}

          {activeTab === "members" && (
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
                Team Members
              </h3>
              <div className="space-y-3">
                {brand.members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--bg)" }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: "var(--t1)" }}>
                        {member.name}
                      </p>
                      <p className="text-sm" style={{ color: "var(--t2)" }}>
                        {member.email}
                      </p>
                    </div>
                    <span className="badge badge-info">{member.role}</span>
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
                {brand.uploads.map((upload: any) => (
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
                        {upload.platform} • {upload.date}
                      </p>
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
