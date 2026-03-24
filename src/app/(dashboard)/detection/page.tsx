"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SectionHeader from "@/components/ui/SectionHeader";
import { BRANDS } from "@/lib/constants";
import { btnPrimary, cardStyle } from "@/lib/styles";

interface BrandSettings {
  sensitivity: number;
  threshold: number;
}

type SettingsState = Record<number, BrandSettings>;

const INITIAL_SETTINGS: SettingsState = {
  1: { sensitivity: 0.7, threshold: 0.8 },
  2: { sensitivity: 0.5, threshold: 0.6 },
  3: { sensitivity: 0.8, threshold: 0.9 },
  4: { sensitivity: 0.6, threshold: 0.7 },
  5: { sensitivity: 0.4, threshold: 0.5 },
};

interface SliderRowProps {
  color: string;
  description: string;
  label: string;
  leftLabel: string;
  onChange: (value: number) => void;
  rightLabel: string;
  value: number;
}

function SliderRow({
  color,
  description,
  label,
  leftLabel,
  onChange,
  rightLabel,
  value,
}: SliderRowProps): React.ReactElement {
  const pct = value * 100;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color,
            background: `${color}15`,
            padding: "2px 10px",
            borderRadius: "6px",
            border: `1px solid ${color}30`,
          }}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <div style={{ position: "relative", height: "20px", display: "flex", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: "4px", borderRadius: "2px", background: "var(--border)" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "4px", borderRadius: "2px", background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 0.1s" }} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ position: "absolute", left: 0, right: 0, width: "100%", opacity: 0, height: "20px", cursor: "pointer", margin: 0 }}
        />
        <div style={{ position: "absolute", left: `calc(${pct}% - 10px)`, width: "20px", height: "20px", borderRadius: "50%", background: "#ffffff", border: `2px solid ${color}`, boxShadow: `0 2px 8px ${color}44`, transition: "left 0.1s", pointerEvents: "none" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>{leftLabel}</span>
        <span style={{ fontSize: "11px", color: "var(--t3)" }}>{rightLabel}</span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

export default function DetectionPage(): React.ReactElement {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [groupAlerts, setGroupAlerts] = useState(false);
  const [activeTab, setActiveTab] = useState(BRANDS[0]?.id ?? 1);

  useEffect(() => {
    const rawUser = sessionStorage.getItem("user");
    if (rawUser && JSON.parse(rawUser).role !== "AGENCY_ADMIN") router.push("/dashboard");
  }, [router]);

  const changeSetting = (id: number, key: keyof BrandSettings, value: number): void => {
    setSettings((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
  };

  const save = async (id: number): Promise<void> => {
    setSaving(id);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSaving(null);
    setSaved(id);
    window.setTimeout(() => setSaved(null), 2500);
  };

  const activeBrand = BRANDS.find((brand) => brand.id === activeTab) ?? BRANDS[0];
  const brandSettings = settings[activeTab];

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <SectionHeader
        title="Brand Detection Controls"
        subtitle="Tune sensitivity and thresholds per workspace without changing the underlying detection logic."
      />

      <div style={{ ...cardStyle, padding: "22px 24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(88,101,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2", flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)", marginBottom: "2px" }}>Alert Fatigue Prevention</p>
              <p style={{ fontSize: "13px", color: "var(--t2)" }}>Group related alerts from the same campaign into a single notification.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {groupAlerts ? (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#3fb950", background: "rgba(63,185,80,0.1)", padding: "3px 10px", borderRadius: "20px", border: "1px solid rgba(63,185,80,0.25)" }}>
                Active
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setGroupAlerts((value) => !value)}
              style={{ width: "46px", height: "26px", borderRadius: "13px", background: groupAlerts ? "linear-gradient(135deg,#5865f2,#818cf8)" : "var(--border)", cursor: "pointer", position: "relative", transition: "all 0.2s", boxShadow: groupAlerts ? "0 2px 8px rgba(88,101,242,0.35)" : "none", border: "none" }}
            >
              <span style={{ position: "absolute", top: "3px", left: groupAlerts ? "23px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#ffffff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
          {BRANDS.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setActiveTab(brand.id)}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                background: "transparent",
                fontSize: "14px",
                fontWeight: activeTab === brand.id ? 700 : 500,
                color: activeTab === brand.id ? brand.color : "var(--t2)",
                cursor: "pointer",
                fontFamily: "inherit",
                borderBottom: `2px solid ${activeTab === brand.id ? brand.color : "transparent"}`,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: brand.color, opacity: activeTab === brand.id ? 1 : 0.4 }} />
                {brand.name}
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: "28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "28px" }}>
            <SliderRow
              label="Sensitivity"
              value={brandSettings.sensitivity}
              onChange={(value) => changeSetting(activeTab, "sensitivity", value)}
              leftLabel="Conservative"
              rightLabel="Aggressive"
              description="Higher values detect more anomalies but may increase false positives."
              color={activeBrand.color}
            />
            <SliderRow
              label="Threshold"
              value={brandSettings.threshold}
              onChange={(value) => changeSetting(activeTab, "threshold", value)}
              leftLabel="Low"
              rightLabel="High"
              description="Minimum anomaly score required to trigger an alert."
              color={activeBrand.color}
            />
          </div>

          <div style={{ padding: "16px 20px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: brandSettings.sensitivity >= 0.7 ? "#f85149" : brandSettings.sensitivity >= 0.4 ? "#d29922" : "#3fb950", marginTop: "4px", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Detection Mode</p>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)" }}>
                  {brandSettings.sensitivity >= 0.7
                    ? "Aggressive - catches more, higher noise"
                    : brandSettings.sensitivity >= 0.4
                      ? "Balanced - recommended"
                      : "Conservative - fewer, higher quality alerts"}
                </p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "11px", color: "var(--t3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Alert Threshold</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)" }}>
                Only anomalies scoring above <span style={{ color: activeBrand.color }}>{(brandSettings.threshold * 100).toFixed(0)}%</span> will trigger alerts.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => void save(activeTab)} disabled={saving === activeTab} style={{ ...btnPrimary, background: saved === activeTab ? "linear-gradient(135deg,#3fb950,#4ade80)" : btnPrimary.background, opacity: saving === activeTab ? 0.75 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
              {saving === activeTab ? (
                <>
                  <div style={{ width: "13px", height: "13px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#ffffff", animation: "spin 0.7s linear infinite" }} />
                  Saving...
                </>
              ) : saved === activeTab ? (
                "Saved!"
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {[
          {
            title: "Sensitivity Control",
            desc: "Higher sensitivity catches smaller deviations but can increase false positives.",
            color: "#5865f2",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ),
          },
          {
            title: "Pro Tip",
            desc: "Start conservative, then tune over time based on alert volume and accuracy.",
            color: "#3fb950",
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ),
          },
        ].map((card) => (
          <div key={card.title} style={{ ...cardStyle, padding: "16px 18px", display: "flex", gap: "12px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${card.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--t1)", marginBottom: "4px" }}>{card.title}</p>
              <p style={{ fontSize: "12px", color: "var(--t2)", lineHeight: 1.5 }}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
