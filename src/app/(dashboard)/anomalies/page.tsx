"use client";

import { useEffect, useState } from "react";

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      // Mock data for now
      const mockAnomalies = [
        {
          id: 1,
          campaign: "Summer Sale Campaign",
          metric: "ROAS",
          anomalyScore: 0.95,
          severity: "HIGH",
          dateRange: "2024-06-15 to 2024-06-22",
          description: "ROAS dropped significantly from 4.2x to 2.1x over the past week",
        },
        {
          id: 2,
          campaign: "Brand Awareness Q3",
          metric: "CTR",
          anomalyScore: 0.78,
          severity: "MEDIUM",
          dateRange: "2024-06-20 to 2024-06-27",
          description: "CTR declined by 40% compared to baseline performance",
        },
        {
          id: 3,
          campaign: "Product Launch",
          metric: "CPC",
          anomalyScore: 0.82,
          severity: "MEDIUM",
          dateRange: "2024-06-18 to 2024-06-25",
          description: "CPC increased by 65% indicating potential bidding issues",
        },
      ];
      setAnomalies(mockAnomalies);
    } catch (error) {
      console.error("Failed to fetch anomalies:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { class: string; text: string }> = {
      HIGH: { class: "badge-danger", text: "HIGH" },
      MEDIUM: { class: "badge-warning", text: "MEDIUM" },
      LOW: { class: "badge-info", text: "LOW" },
    };

    const config = severityConfig[severity] || { class: "badge-info", text: severity };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "var(--danger)";
    if (score >= 0.6) return "var(--warning)";
    return "var(--success)";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--t1)" }}>
          Anomalies
        </h1>
        <p style={{ color: "var(--t2)" }}>
          Explore statistical anomalies detected in your campaign performance
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="input-field">
            <option>All Metrics</option>
            <option>ROAS</option>
            <option>CTR</option>
            <option>CPC</option>
            <option>CPA</option>
          </select>
          <select className="input-field">
            <option>All Severity</option>
            <option>HIGH</option>
            <option>MEDIUM</option>
            <option>LOW</option>
          </select>
          <input type="date" className="input-field" />
          <input type="date" className="input-field" />
        </div>
      </div>

      {/* Anomalies List */}
      {anomalies.length > 0 ? (
        <div className="space-y-4">
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--t1)" }}>
                    {anomaly.campaign}
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm" style={{ color: "var(--t3)" }}>Metric:</span>
                    <span className="font-medium" style={{ color: "var(--t1)" }}>{anomaly.metric}</span>
                    {getSeverityBadge(anomaly.severity)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm mb-1" style={{ color: "var(--t3)" }}>Anomaly Score</div>
                  <div className="text-2xl font-bold" style={{ color: getScoreColor(anomaly.anomalyScore) }}>
                    {(anomaly.anomalyScore * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Z-Score Indicator */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: "var(--t3)" }}>Statistical Deviation</span>
                  <span className="text-sm font-medium" style={{ color: getScoreColor(anomaly.anomalyScore) }}>
                    {anomaly.anomalyScore >= 0.8 ? "High" : anomaly.anomalyScore >= 0.6 ? "Medium" : "Low"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${anomaly.anomalyScore * 100}%`,
                      background: getScoreColor(anomaly.anomalyScore)
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm" style={{ color: "var(--t3)" }}>Date Range</p>
                  <p className="font-medium" style={{ color: "var(--t1)" }}>{anomaly.dateRange}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--t3)" }}>Analysis</p>
                  <p className="font-medium" style={{ color: "var(--t1)" }}>{anomaly.description}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary px-6 py-2">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📉</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--t1)" }}>
            No anomalies detected
          </h3>
          <p style={{ color: "var(--t2)" }}>
            Your campaigns are performing within expected ranges
          </p>
        </div>
      )}
    </div>
  );
}
