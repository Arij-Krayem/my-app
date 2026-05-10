"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";

interface Brand {
  id: string;
  name: string;
  colorClass: string;
}

interface AccuracySettings {
  sensitivity: number;
  threshold: number;
}

const BRAND_CLASSES = [
  styles.brandPurple,
  styles.brandGreen,
  styles.brandRed,
  styles.brandAmber,
  styles.brandSky,
  styles.brandViolet,
];

function SliderRow({ label, value, onChange, leftLabel, rightLabel, description, colorClass }: {
  label: string; value: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string; description: string; colorClass: string;
}) {
  return (
    <div className={colorClass}>
      <div className={styles.sliderHeader}>
        <label className={styles.sliderLabel}>{label}</label>
        <span className={styles.sliderValue}>{value.toFixed(1)}</span>
      </div>
      <div className={styles.sliderTrack}>
        <progress className={styles.rangeSlider} value={value} max={1} />
        <input type="range" min="0" max="1" step="0.1" value={value} onChange={e => onChange(parseFloat(e.target.value))} className={styles.rangeInput} />
      </div>
      <div className={styles.rangeLabels}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

export default function DetectionPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<Record<string, AccuracySettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setTab] = useState("");

  const token = () => sessionStorage.getItem("access_token") ?? "";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const brandsRes = await fetch("/api/brands", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!brandsRes.ok) throw new Error("Failed to load brands");
      const brandsData = await brandsRes.json();
      const brandList = (brandsData.items ?? []).map((b: { id: string; name: string }, i: number) => ({
        id: b.id,
        name: b.name,
        colorClass: BRAND_CLASSES[i % BRAND_CLASSES.length],
      }));
      setBrands(brandList);
      if (brandList.length > 0) setTab(brandList[0].id);

      const settingsMap: Record<string, AccuracySettings> = {};
      await Promise.all(brandList.map(async (b: Brand) => {
        try {
          const res = await fetch(`/api/detection/accuracy?brandId=${b.id}`, {
            headers: { Authorization: `Bearer ${token()}` },
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            settingsMap[b.id] = {
              sensitivity: data.sensitivity ?? 0.7,
              threshold: data.threshold ?? 0.8,
            };
          } else {
            settingsMap[b.id] = { sensitivity: 0.7, threshold: 0.8 };
          }
        } catch {
          settingsMap[b.id] = { sensitivity: 0.7, threshold: 0.8 };
        }
      }));
      setSettings(settingsMap);
    } catch {
      setError("Could not load detection settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const change = (brandId: string, key: "sensitivity" | "threshold", val: number) =>
    setSettings(s => ({ ...s, [brandId]: { ...s[brandId], [key]: val } }));

  const save = async (brandId: string) => {
    setSaving(brandId);
    try {
      const res = await fetch("/api/detection/accuracy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({
          brandId,
          sensitivity: settings[brandId].sensitivity,
          threshold: settings[brandId].threshold,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(brandId);
      setTimeout(() => setSaved(null), 2500);
    } catch {
      setError("Failed to save settings. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(null);
    }
  };

  const activeBrand = brands.find(b => b.id === activeTab);
  const s = settings[activeTab] ?? { sensitivity: 0.7, threshold: 0.8 };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-copy">
          <div className="dashboard-eyebrow">DETECTION</div>
          <h1 className="dashboard-title">Detection settings</h1>
          <p className="dashboard-subtitle">Configure anomaly sensitivity and alert thresholds using the same card, accent, and spacing system as the rest of the dashboard.</p>
        </div>
      </div>

      {error && <div className="dashboard-banner-error">{error}</div>}

      <div className="dashboard-card">
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loader} />
            <p className={styles.loadingText}>Loading brand settings...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="dashboard-empty-state">
            <div className="dashboard-empty-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="dashboard-empty-title">No brands available</div>
            <div className="dashboard-empty-subtitle">Create a brand first to configure detection sensitivity and threshold settings.</div>
          </div>
        ) : (
          <>
            <div className={styles.tabs}>
              {brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => setTab(b.id)}
                  className={`${styles.tabButton} ${b.colorClass} ${activeTab === b.id ? styles.tabButtonActive : ""}`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {activeBrand && (
              <div className={`${styles.content} ${activeBrand.colorClass}`}>
                <div className={styles.sliderGrid}>
                  <SliderRow label="Sensitivity" value={s.sensitivity} onChange={v => change(activeTab, "sensitivity", v)} leftLabel="Conservative" rightLabel="Aggressive" description="Higher values detect more anomalies but may increase false positives." colorClass={activeBrand.colorClass} />
                  <SliderRow label="Threshold" value={s.threshold} onChange={v => change(activeTab, "threshold", v)} leftLabel="Low" rightLabel="High" description="Minimum anomaly score required to trigger an alert." colorClass={activeBrand.colorClass} />
                </div>

                <div className={`dashboard-card ${styles.summaryCard}`}>
                  <div className={styles.summaryItem}>
                    <p className={styles.infoLabel}>Detection Mode</p>
                    <p className={styles.infoText}>
                      {s.sensitivity >= 0.7 ? "Aggressive: catches more deviations with higher noise." : s.sensitivity >= 0.4 ? "Balanced: recommended default for most brands." : "Conservative: fewer, higher-confidence alerts."}
                    </p>
                  </div>
                  <div className={styles.summaryItem}>
                    <p className={styles.infoLabel}>Alert Threshold</p>
                    <p className={styles.infoText}>Only anomalies scoring above <span className={styles.accentText}>{(s.threshold * 100).toFixed(0)}%</span> will trigger alerts.</p>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button onClick={() => save(activeTab)} disabled={saving === activeTab} className="btn-primary">
                    {saving === activeTab ? "Saving..." : saved === activeTab ? "Saved!" : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
