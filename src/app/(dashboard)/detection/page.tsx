"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DetectionPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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
    fetchBrandsAndSettings();
  }, [router]);

  const fetchBrandsAndSettings = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      // Mock data for now
      const mockBrands = [
        { id: 1, name: "TechCorp" },
        { id: 2, name: "RetailMax" },
        { id: 3, name: "ServicePro" },
      ];

      const mockSettings = {
        1: { sensitivity: 0.7, threshold: 0.8 },
        2: { sensitivity: 0.5, threshold: 0.6 },
        3: { sensitivity: 0.8, threshold: 0.9 },
      };

      setBrands(mockBrands);
      setSettings(mockSettings);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (brandId: number, setting: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      [brandId]: {
        ...prev[brandId],
        [setting]: value
      }
    }));
  };

  const handleSave = async (brandId: number) => {
    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saved settings for brand ${brandId}:`, settings[brandId]);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const [alertFatigue, setAlertFatigue] = useState(false);

  const handleAlertFatigueToggle = () => {
    setAlertFatigue(!alertFatigue);
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
          Detection Settings
        </h1>
        <p style={{ color: "var(--t2)" }}>
          Configure anomaly detection sensitivity and thresholds per brand
        </p>
      </div>

      {/* Alert Fatigue Section */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--t1)" }}>
          Alert Fatigue Prevention
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: "var(--t1)" }}>
                Group Related Alerts
              </p>
              <p className="text-sm" style={{ color: "var(--t2)" }}>
                Combine multiple alerts from the same campaign into a single notification
              </p>
            </div>
            <button
              onClick={handleAlertFatigueToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                alertFatigue ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertFatigue ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          
          {alertFatigue && (
            <div className="p-4 rounded-lg" style={{ background: "var(--accent-glow)" }}>
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                <strong>Active:</strong> Related alerts will be grouped to reduce notification frequency
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Per-Brand Settings */}
      <div className="space-y-6">
        {brands.map((brand) => (
          <div key={brand.id} className="card p-6">
            <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--t1)" }}>
              {brand.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sensitivity Setting */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  Sensitivity: {(settings[brand.id]?.sensitivity || 0.5).toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings[brand.id]?.sensitivity || 0.5}
                  onChange={(e) => handleSettingChange(brand.id, "sensitivity", parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "var(--t3)" }}>
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--t2)" }}>
                  Higher values detect more anomalies but may increase false positives
                </p>
              </div>

              {/* Threshold Setting */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--t1)" }}>
                  Threshold: {(settings[brand.id]?.threshold || 0.5).toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings[brand.id]?.threshold || 0.5}
                  onChange={(e) => handleSettingChange(brand.id, "threshold", parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: "var(--t3)" }}>
                  <span>Low</span>
                  <span>High</span>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--t2)" }}>
                  Minimum anomaly score required to trigger an alert
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleSave(brand.id)}
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Explanation Section */}
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
          Understanding Detection Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2" style={{ color: "var(--t1)" }}>
              🎛 Sensitivity Control
            </h4>
            <p className="text-sm" style={{ color: "var(--t2)" }}>
              Controls how sensitive the anomaly detection algorithm is. Higher sensitivity 
              will detect smaller deviations but may result in more false positives.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2" style={{ color: "var(--t1)" }}>
              📊 Threshold Setting
            </h4>
            <p className="text-sm" style={{ color: "var(--t2)" }}>
              Sets the minimum anomaly score (0-1) required to trigger an alert. 
              Only anomalies scoring above this threshold will generate notifications.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg" style={{ background: "var(--bg)" }}>
          <p className="text-sm" style={{ color: "var(--t2)" }}>
            <strong>💡 Tip:</strong> Start with conservative settings (low sensitivity, high threshold) 
            and gradually adjust based on the volume and accuracy of alerts you receive.
          </p>
        </div>
      </div>
    </div>
  );
}
