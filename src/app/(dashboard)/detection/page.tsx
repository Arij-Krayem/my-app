"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Brand {
  id:    string;
  name:  string;
  color: string;
}

interface AccuracySettings {
  sensitivity: number;
  threshold:   number;
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
        <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</label>
        <span style={{ fontSize: "14px", fontWeight: "800", color: color, background: `${color}15`, padding: "2px 10px", borderRadius: "6px", border: `1px solid ${color}30` }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ position: "relative", height: "20px", display: "flex", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: "4px", borderRadius: "2px", background: "var(--border)" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "4px", borderRadius: "2px", background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 0.1s" }} />
        <input
          type="range" min="0" max="1" step="0.1" value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", left: 0, right: 0, width: "100%", opacity: 0, height: "20px", cursor: "pointer", margin: 0 }}
        />
        <div style={{ position: "absolute", left: `calc(${pct}% - 10px)`, width: "20px", height: "20px", borderRadius: "50%", background: "white", border: `2px solid ${color}`, boxShadow: `0 2px 8px ${color}44`, transition: "left 0.1s", pointerEvents: "none" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>{leftLabel}</span>
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>{rightLabel}</span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

export default function DetectionPage() {
  const router = useRouter();
  const [brands,    setBrands]    = useState<Brand[]>([]);
  const [settings,  setSettings]  = useState<Record<string, AccuracySettings>>({});
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [saved,     setSaved]     = useState<string | null>(null);
  const [error,     setError]     = useState("");
  const [groupAlerts, setGroup]   = useState(false);
  const [activeTab, setTab]       = useState("");

  const token = () => sessionStorage.getItem("access_token") ?? "";

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (raw && JSON.parse(raw).role !== "AGENCY_ADMIN") router.push("/dashboard");
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch brands
      const brandsRes = await fetch("/api/brands", {
        headers: { Authorization: `Bearer ${token()}` },
        credentials: "include",
      });
      if (!brandsRes.ok) throw new Error("Failed to load brands");
      const brandsData = await brandsRes.json();
      const brandList  = (brandsData.items ?? []).map((b: any, i: number) => ({
        id:    b.id,
        name:  b.name,
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));
      setBrands(brandList);
      if (brandList.length > 0) setTab(brandList[0].id);

      // Fetch accuracy settings for each brand
      const settingsMap: Record<string, AccuracySettings> = {};
      await Promise.all(brandList.map(async (b: Brand) => {
        try {
          const res  = await fetch(`/api/detection/accuracy?brandId=${b.id}`, {
            headers: { Authorization: `Bearer ${token()}` },
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            settingsMap[b.id] = {
              sensitivity: data.sensitivity ?? 0.7,
              threshold:   data.threshold   ?? 0.8,
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
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        credentials: "include",
        body: JSON.stringify({
          brandId,
          sensitivity: settings[brandId].sensitivity,
          threshold:   settings[brandId].threshold,
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
  const s           = settings[activeTab] ?? { sensitivity: 0.7, threshold: 0.8 };

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Detection Settings</h1>
        <p style={{ fontSize: "14px", color: "var(--t2)" }}>Configure anomaly detection sensitivity and thresholds per brand</p>
      </div>

      {error && (
        <div style={{ background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.25)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#f85149", fontSize: "14px" }}>
          ✗ {error}
        </div>
      )}

      {/* Alert fatigue card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px 24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(88,101,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)", marginBottom: "2px" }}>Alert Fatigue Prevention</p>
              <p style={{ fontSize: "13px", color: "var(--t2)" }}>Group related alerts from the same campaign into a single notification</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {groupAlerts && <span style={{ fontSize: "11px", fontWeight: "700", color: "#3fb950", background: "rgba(63,185,80,0.1)", padding: "3px 10px", borderRadius: "20px", border: "1px solid rgba(63,185,80,0.25)" }}>Active</span>}
            <div onClick={() => setGroup(g => !g)} style={{ width: "46px", height: "26px", borderRadius: "13px", background: groupAlerts ? "linear-gradient(135deg,#5865f2,#818cf8)" : "var(--border)", cursor: "pointer", position: "relative", transition: "all 0.2s", boxShadow: groupAlerts ? "0 2px 8px rgba(88,101,242,0.35)" : "none" }}>
              <div style={{ position: "absolute", top: "3px", left: groupAlerts ? "23px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Brand tabs + settings */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px", color: "var(--t2)" }}>Loading brand settings…</p>
          </div>
        ) : brands.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--t2)" }}>
            <p style={{ fontWeight: 600 }}>No brands found</p>
            <p style={{ fontSize: 13 }}>Create a brand first to configure detection settings.</p>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg)", overflowX: "auto" }}>
              {brands.map(b => (
                <button key={b.id} onClick={() => setTab(b.id)}
                  style={{
                    flex: 1, minWidth: "120px", padding: "14px 16px", border: "none", background: "transparent",
                    fontSize: "14px", fontWeight: activeTab === b.id ? "700" : "500",
                    color: activeTab === b.id ? b.color : "var(--t2)",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    borderBottom: `2px solid ${activeTab === b.id ? b.color : "transparent"}`,
                  }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: b.color, opacity: activeTab === b.id ? 1 : 0.4 }} />
                    {b.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Settings content */}
            {activeBrand && (
              <div style={{ padding: "28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "28px" }}>
                  <SliderRow
                    label="Sensitivity"
                    value={s.sensitivity}
                    onChange={v => change(activeTab, "sensitivity", v)}
                    leftLabel="Conservative" rightLabel="Aggressive"
                    description="Higher values detect more anomalies but may increase false positives"
                    color={activeBrand.color}
                  />
                  <SliderRow
                    label="Threshold"
                    value={s.threshold}
                    onChange={v => change(activeTab, "threshold", v)}
                    leftLabel="Low" rightLabel="High"
                    description="Minimum anomaly score required to trigger an alert"
                    color={activeBrand.color}
                  />
                </div>

                {/* Visual preview */}
                <div style={{ padding: "16px 20px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.sensitivity >= 0.7 ? "#f85149" : s.sensitivity >= 0.4 ? "#d29922" : "#3fb950", marginTop: "4px", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Detection Mode</p>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>
                        {s.sensitivity >= 0.7 ? "Aggressive — catches more, higher noise" : s.sensitivity >= 0.4 ? "Balanced — recommended" : "Conservative — fewer, higher quality alerts"}
                      </p>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Alert Threshold</p>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>
                      Only anomalies scoring above <span style={{ color: activeBrand.color }}>{(s.threshold * 100).toFixed(0)}%</span> will trigger alerts
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => save(activeTab)} disabled={saving === activeTab}
                    style={{ padding: "10px 28px", borderRadius: "10px", border: "none", background: saved === activeTab ? "linear-gradient(135deg,#3fb950,#4ade80)" : "linear-gradient(135deg,#5865f2,#818cf8)", color: "white", fontSize: "14px", fontWeight: "700", cursor: saving === activeTab ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.25)", opacity: saving === activeTab ? 0.75 : 1, transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px" }}>
                    {saving === activeTab ? (
                      <><div style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />Saving...</>
                    ) : saved === activeTab ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
                    ) : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info cards */}
      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {[
          { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "Sensitivity Control", desc: "Controls how sensitive detection is. Higher values catch smaller deviations but may increase false positive rates.", color: "#5865f2" },
          { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, title: "Pro Tip", desc: "Start conservative (low sensitivity, high threshold) and tune over time based on alert volume and accuracy.", color: "#3fb950" },
        ].map(c => (
          <div key={c.title} style={{ padding: "16px 18px", borderRadius: "12px", background: "var(--card)", border: "1px solid var(--border)", display: "flex", gap: "12px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${c.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, flexShrink: 0 }}>{c.icon}</div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>{c.title}</p>
              <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}