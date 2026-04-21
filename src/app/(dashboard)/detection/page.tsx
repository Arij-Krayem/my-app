"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import {
  cardStyle,
  emptyIconWrapStyle,
  emptyStateWrapStyle,
  emptySubtitleStyle,
  emptyTitleStyle,
  largeCardStyle,
  pageEyebrowStyle,
  pageSubtitleStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  pillStyle,
} from "@/components/dashboard/designSystem";

interface Brand {
  id: string;
  name: string;
  color: string;
}

interface AccuracySettings {
  sensitivity: number;
  threshold: number;
}

const AVATAR_COLORS = ["#5865f2", "#16a34a", "#dc2626", "#d97706", "#0ea5e9", "#8b5cf6"];

function SliderRow({
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
  description,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
  description: string;
  color: string;
}) {
  const pct = value * 100;
  return (
    <div style={{ ...cardStyle, padding: 18, boxShadow: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {label}
        </label>
        <span style={{ ...pillStyle(color, `${color}12`, `${color}30`), boxShadow: "none" }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center", marginBottom: 8 }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 999, background: "rgba(148,163,184,0.18)" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 4, borderRadius: 999, background: color }} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={value}
          onChange={(event) => onChange(parseFloat(event.target.value))}
          style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", cursor: "pointer" }}
        />
        <div style={{ position: "absolute", left: `calc(${pct}% - 10px)`, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: `2px solid ${color}`, boxShadow: `0 2px 8px ${color}44` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>{leftLabel}</span>
        <span style={{ color: "#94a3b8", fontSize: 12 }}>{rightLabel}</span>
      </div>
      <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}

export default function DetectionPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<Record<string, AccuracySettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [groupAlerts, setGroup] = useState(false);
  const [activeTab, setTab] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (raw && JSON.parse(raw).role !== "AGENCY_ADMIN") {
      router.push("/dashboard");
    }
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const brandsData = await apiFetch<{ items?: { id: string; name: string }[] }>("/api/brands");
      const brandList = (brandsData.items ?? []).map((brand: { id: string; name: string }, index: number) => ({
        id: brand.id,
        name: brand.name,
        color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      }));
      setBrands(brandList);
      if (brandList.length > 0) setTab(brandList[0].id);

      const settingsMap: Record<string, AccuracySettings> = {};
      await Promise.all(
        brandList.map(async (brand: Brand) => {
          try {
            const data = await apiFetch<{ sensitivity?: number; threshold?: number }>(`/api/detection/accuracy?brandId=${brand.id}`);
            settingsMap[brand.id] = {
              sensitivity: data.sensitivity ?? 0.7,
              threshold: data.threshold ?? 0.8,
            };
          } catch (fetchError) {
            console.error(`[detection] Failed to load settings for ${brand.id}`, fetchError);
            settingsMap[brand.id] = { sensitivity: 0.7, threshold: 0.8 };
          }
        }),
      );
      setSettings(settingsMap);
    } catch (fetchError) {
      console.error("[detection] Failed to load detection settings", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Could not load detection settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const change = (brandId: string, key: "sensitivity" | "threshold", value: number) =>
    setSettings((current) => ({ ...current, [brandId]: { ...current[brandId], [key]: value } }));

  const save = async (brandId: string) => {
    setSaving(brandId);
    try {
      await apiFetch("/api/detection/accuracy", {
        method: "POST",
        body: JSON.stringify({
          brandId,
          sensitivity: settings[brandId].sensitivity,
          threshold: settings[brandId].threshold,
        }),
      });
      setSaved(brandId);
      setTimeout(() => setSaved(null), 2500);
    } catch (fetchError) {
      console.error("[detection] Failed to save settings", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to save settings. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(null);
    }
  };

  const activeBrand = brands.find((brand) => brand.id === activeTab);
  const currentSettings = settings[activeTab] ?? { sensitivity: 0.7, threshold: 0.8 };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={pageEyebrowStyle}>Detection</div>
        <p style={pageSubtitleStyle}>Configure anomaly sensitivity and alert thresholds using the same card, accent, and spacing system as the rest of the dashboard.</p>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            marginBottom: 16,
            padding: "14px 16px",
            background: "rgba(239,68,68,0.06)",
            borderColor: "rgba(239,68,68,0.2)",
            color: "#dc2626",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ ...largeCardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Alert fatigue prevention</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Group related alerts from the same campaign into a single notification.</div>
          </div>
          <button
            type="button"
            onClick={() => setGroup((value) => !value)}
            style={groupAlerts ? primaryButtonStyle : secondaryButtonStyle}
          >
            {groupAlerts ? "Grouping On" : "Grouping Off"}
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading ? (
          <div style={emptyStateWrapStyle}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid rgba(99,102,241,0.12)", borderTopColor: "#6366F1", animation: "spin 0.8s linear infinite" }} />
            <p style={{ ...emptySubtitleStyle, marginTop: 18 }}>Loading brand settings...</p>
          </div>
        ) : brands.length === 0 ? (
          <div style={emptyStateWrapStyle}>
            <div style={emptyIconWrapStyle}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={emptyTitleStyle}>No brands available</h2>
            <p style={emptySubtitleStyle}>Create a brand first to configure detection sensitivity and threshold settings.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", borderBottom: "1px solid rgba(15,23,42,0.06)", background: "#fcfcff", overflowX: "auto" }}>
              {brands.map((brand) => {
                const active = activeTab === brand.id;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => setTab(brand.id)}
                    style={{
                      padding: "14px 16px",
                      border: "none",
                      borderBottom: active ? `2px solid ${brand.color}` : "2px solid transparent",
                      background: "transparent",
                      color: active ? brand.color : "#64748b",
                      fontSize: 14,
                      fontWeight: active ? 700 : 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      minWidth: 140,
                    }}
                  >
                    {brand.name}
                  </button>
                );
              })}
            </div>

            {activeBrand && (
              <div style={{ padding: 22 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                  <SliderRow
                    label="Sensitivity"
                    value={currentSettings.sensitivity}
                    onChange={(value) => change(activeTab, "sensitivity", value)}
                    leftLabel="Conservative"
                    rightLabel="Aggressive"
                    description="Higher values detect more anomalies but may increase false positives."
                    color={activeBrand.color}
                  />
                  <SliderRow
                    label="Threshold"
                    value={currentSettings.threshold}
                    onChange={(value) => change(activeTab, "threshold", value)}
                    leftLabel="Low"
                    rightLabel="High"
                    description="Minimum anomaly score required to trigger an alert."
                    color={activeBrand.color}
                  />
                </div>

                <div style={{ ...largeCardStyle, marginBottom: 16, background: "#fcfcff" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                        Detection Mode
                      </div>
                      <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                        {currentSettings.sensitivity >= 0.7
                          ? "Aggressive"
                          : currentSettings.sensitivity >= 0.4
                            ? "Balanced"
                            : "Conservative"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                        Alert Threshold
                      </div>
                      <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                        {(currentSettings.threshold * 100).toFixed(0)}% required to trigger alerts
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => void save(activeTab)} disabled={saving === activeTab} style={saved === activeTab ? { ...secondaryButtonStyle, color: "#16a34a", borderColor: "rgba(34,197,94,0.22)" } : primaryButtonStyle}>
                    {saving === activeTab ? "Saving..." : saved === activeTab ? "Saved" : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <div style={largeCardStyle}>
          <div style={{ ...pillStyle("#4f46e5", "rgba(99,102,241,0.1)", "rgba(99,102,241,0.22)"), marginBottom: 10, width: "fit-content" }}>Sensitivity Control</div>
          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Higher sensitivity catches smaller deviations, while lower sensitivity focuses on more significant changes.</div>
        </div>
        <div style={largeCardStyle}>
          <div style={{ ...pillStyle("#16a34a", "rgba(34,197,94,0.1)", "rgba(34,197,94,0.22)"), marginBottom: 10, width: "fit-content" }}>Pro Tip</div>
          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Start balanced, then tune based on alert volume and the quality of detected anomalies for each brand.</div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
