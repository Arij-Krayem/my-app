"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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

function SliderRow({ label, value, onChange, leftLabel, rightLabel, description, color }: {
  label: string; value: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string; description: string; color: string;
}) {
  const pct = value * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</label>
        <span style={{ fontSize: "14px", fontWeight: "800", color, background: `${color}15`, padding: "3px 10px", borderRadius: "999px", border: `1px solid ${color}30` }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ position: "relative", height: "20px", display: "flex", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: "6px", borderRadius: "999px", background: "var(--border)" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "6px", borderRadius: "999px", background: color, transition: "width 0.1s" }} />
        <input type="range" min="0" max="1" step="0.1" value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ position: "absolute", left: 0, right: 0, width: "100%", opacity: 0, height: "20px", cursor: "pointer", margin: 0 }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 10px)`, width: "20px", height: "20px", borderRadius: "50%", background: "white", border: `2px solid ${color}`, transition: "left 0.1s", pointerEvents: "none" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>{leftLabel}</span>
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>{rightLabel}</span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.6 }}>{description}</p>
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
  const [activeTab, setTab] = useState("");

  const token = () => sessionStorage.getItem("access_token") ?? "";

  // ── REMOVED: role check that was redirecting marketers to dashboard ────────
  // Marketers are allowed here — the API filters data to their assigned brands.

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
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
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
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px", color: "var(--t2)" }}>Loading brand settings...</p>
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
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "#f8fafc", overflowX: "auto" }}>
              {brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => setTab(b.id)}
                  style={{ minWidth: "140px", padding: "14px 16px", border: "none", background: "transparent", fontSize: "14px", fontWeight: activeTab === b.id ? "800" : "600", color: activeTab === b.id ? b.color : "var(--t2)", cursor: "pointer", fontFamily: "inherit", borderBottom: `2px solid ${activeTab === b.id ? b.color : "transparent"}` }}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {activeBrand && (
              <div style={{ padding: "28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "28px" }}>
                  <SliderRow label="Sensitivity" value={s.sensitivity} onChange={v => change(activeTab, "sensitivity", v)} leftLabel="Conservative" rightLabel="Aggressive" description="Higher values detect more anomalies but may increase false positives." color={activeBrand.color} />
                  <SliderRow label="Threshold" value={s.threshold} onChange={v => change(activeTab, "threshold", v)} leftLabel="Low" rightLabel="High" description="Minimum anomaly score required to trigger an alert." color={activeBrand.color} />
                </div>

                <div className="dashboard-card" style={{ padding: "16px 20px", background: "#f8fafc", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Detection Mode</p>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)" }}>
                      {s.sensitivity >= 0.7 ? "Aggressive: catches more deviations with higher noise." : s.sensitivity >= 0.4 ? "Balanced: recommended default for most brands." : "Conservative: fewer, higher-confidence alerts."}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "4px" }}>Alert Threshold</p>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)" }}>Only anomalies scoring above <span style={{ color: activeBrand.color }}>{(s.threshold * 100).toFixed(0)}%</span> will trigger alerts.</p>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => save(activeTab)} disabled={saving === activeTab} className="btn-primary">
                    {saving === activeTab ? "Saving..." : saved === activeTab ? "Saved!" : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
