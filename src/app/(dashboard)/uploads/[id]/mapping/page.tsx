"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ColumnMappingPage() {
  const [csvData, setCsvData] = useState<any>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const uploadId = params.id as string;

  useEffect(() => {
    fetchUploadData();
  }, [uploadId]);

  const fetchUploadData = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`/api/uploads/${uploadId}/mapping`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCsvData(data);
        
        // Initialize mappings with existing data or empty
        const initialMappings: Record<string, string> = {};
        data.headers?.forEach((header: string) => {
          initialMappings[header] = data.existingMappings?.[header] || "";
        });
        setMappings(initialMappings);
      }
    } catch (error) {
      console.error("Failed to fetch upload data:", error);
    } finally {
      setLoading(false);
    }
  };

  const targetColumns = [
    { value: "spend", label: "Spend" },
    { value: "clicks", label: "Clicks" },
    { value: "impressions", label: "Impressions" },
    { value: "roas", label: "ROAS" },
    { value: "ctr", label: "CTR" },
    { value: "cpc", label: "CPC" },
    { value: "cpa", label: "CPA" },
    { value: "date", label: "Date" },
    { value: "campaign_id", label: "Campaign ID" },
    { value: "campaign_name", label: "Campaign Name" },
    { value: "platform", label: "Platform" },
  ];

  const handleMappingChange = (header: string, target: string) => {
    setMappings(prev => ({
      ...prev,
      [header]: target
    }));
  };

  const autoMap = () => {
    if (!csvData?.headers) return;

    const autoMappings: Record<string, string> = {};
    
    csvData.headers.forEach((header: string) => {
      const lowerHeader = header.toLowerCase();
      
      // Simple auto-mapping logic
      if (lowerHeader.includes("spend") || lowerHeader.includes("cost")) {
        autoMappings[header] = "spend";
      } else if (lowerHeader.includes("click")) {
        autoMappings[header] = "clicks";
      } else if (lowerHeader.includes("impression")) {
        autoMappings[header] = "impressions";
      } else if (lowerHeader.includes("roas") || lowerHeader.includes("return")) {
        autoMappings[header] = "roas";
      } else if (lowerHeader.includes("ctr")) {
        autoMappings[header] = "ctr";
      } else if (lowerHeader.includes("cpc")) {
        autoMappings[header] = "cpc";
      } else if (lowerHeader.includes("cpa")) {
        autoMappings[header] = "cpa";
      } else if (lowerHeader.includes("date")) {
        autoMappings[header] = "date";
      } else if (lowerHeader.includes("campaign") && lowerHeader.includes("id")) {
        autoMappings[header] = "campaign_id";
      } else if (lowerHeader.includes("campaign") && lowerHeader.includes("name")) {
        autoMappings[header] = "campaign_name";
      } else if (lowerHeader.includes("platform")) {
        autoMappings[header] = "platform";
      }
    });

    setMappings(prev => ({ ...prev, ...autoMappings }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = sessionStorage.getItem("access_token");
      const response = await fetch(`/api/uploads/${uploadId}/mapping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ mappings }),
      });

      if (response.ok) {
        router.push("/uploads");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save mappings");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save mappings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getMappedCount = () => {
    return Object.values(mappings).filter(value => value !== "").length;
  };

  const getTotalColumns = () => {
    return csvData?.headers?.length || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" style={{ width: "40px", height: "40px" }}></div>
      </div>
    );
  }

  if (!csvData) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--t2)" }}>Upload data not found.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--t1)" }}>
          Map Your Columns
        </h1>
        <p style={{ color: "var(--t2)" }}>
          Match your CSV columns to our unified schema for analysis
        </p>
      </div>

      {/* Progress */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--t1)" }}>
            Mapping Progress
          </h3>
          <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            {getMappedCount()} / {getTotalColumns()} columns mapped
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${(getMappedCount() / getTotalColumns()) * 100}%`,
              background: "var(--accent)"
            }}
          ></div>
        </div>
      </div>

      {/* Auto Map Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={autoMap}
          className="btn-primary"
        >
          🤖 Auto-Map Columns
        </button>
      </div>

      {/* Mapping Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Your Column</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Sample Data</th>
                <th className="text-left p-4" style={{ color: "var(--t1)" }}>Map To</th>
              </tr>
            </thead>
            <tbody>
              {csvData.headers?.map((header: string, index: number) => (
                <tr key={header} style={{ borderBottom: `1px solid var(--border)` }}>
                  <td className="p-4">
                    <div className="font-medium" style={{ color: "var(--t1)" }}>
                      {header}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm" style={{ color: "var(--t2)" }}>
                      {csvData.sampleData?.[index]?.slice(0, 50)}
                      {csvData.sampleData?.[index]?.length > 50 && "..."}
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={mappings[header] || ""}
                      onChange={(e) => handleMappingChange(header, e.target.value)}
                      className="input-field w-full"
                      style={{ minWidth: "150px" }}
                    >
                      <option value="">-- Select Column --</option>
                      {targetColumns.map((column) => (
                        <option key={column.value} value={column.value}>
                          {column.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={() => router.push("/uploads")}
          className="px-6 py-3 rounded-lg font-medium transition-colors"
          style={{
            background: "var(--card)",
            color: "var(--t1)",
            border: "1px solid var(--border)"
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn-primary px-8 py-3"
          disabled={saving || getMappedCount() === 0}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="loading-spinner"></div>
              Saving...
            </div>
          ) : (
            "Save Mappings"
          )}
        </button>
      </div>
    </div>
  );
}
