"use client";
// src/components/AnomalyToast.tsx
// ─── Mounts globally in layout.tsx — listens for anomaly socket events ────────

import { useEffect, useState } from "react";
import { getSocket }           from "@/lib/socket-client";

interface AnomalyEvent {
  brandId:  string;
  uploadId: string;
  total:    number;
  high:     number;
  medium:   number;
  low:      number;
  method:   string;
  topAnomalies: {
    metric:   string;
    severity: string;
    zScore:   number;
    campaign: string;
  }[];
}

interface Toast {
  id:    string;
  event: AnomalyEvent;
}

export default function AnomalyToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const socket = getSocket();
    let brandIds: string[] = [];

    const joinAccessibleBrands = async () => {
      const token = sessionStorage.getItem("access_token");
      if (!token) return;

      try {
        const response = await fetch("/api/brands", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!response.ok) return;

        const data = await response.json();
        const list = (data.items ?? []) as { id: string }[];
        brandIds = list.map((brand) => brand.id);
        brandIds.forEach((id) => socket.emit("join:brand", id));
      } catch (error) {
        console.warn("[AnomalyToast] Failed to join brand rooms:", error);
      }
    };

    const handleConnect = () => {
      console.log("[AnomalyToast] Socket connected:", socket.id);
      void joinAccessibleBrands();
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      void joinAccessibleBrands();
    }

    // Listen for anomaly detection events
    socket.on("anomalies:detected", (event: AnomalyEvent) => {
      console.log("[AnomalyToast] Received event:", event);
      const toast: Toast = { id: `${Date.now()}-${Math.random()}`, event };
      setToasts(prev => [...prev, toast]);

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 8000);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("anomalies:detected");
      brandIds.forEach(id => socket.emit("leave:brand", id));
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:      "fixed",
      bottom:        "24px",
      right:         "24px",
      zIndex:        9999,
      display:       "flex",
      flexDirection: "column",
      gap:           "10px",
      maxWidth:      "380px",
    }}>
      {toasts.map(toast => (
        <AnomalyToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </div>
  );
}

function AnomalyToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { event } = toast;
  const hasHigh   = event.high > 0;

  return (
    <div style={{
      background:   "var(--card, #fff)",
      border:       `1px solid ${hasHigh ? "rgba(248,81,73,0.3)" : "rgba(210,153,34,0.3)"}`,
      borderLeft:   `4px solid ${hasHigh ? "#f85149" : "#d29922"}`,
      borderRadius: "12px",
      padding:      "14px 16px",
      boxShadow:    "0 8px 24px rgba(0,0,0,0.12)",
      animation:    "slideInRight 0.3s ease",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Pulsing dot */}
          <div style={{
            width:        "8px",
            height:       "8px",
            borderRadius: "50%",
            background:   hasHigh ? "#f85149" : "#d29922",
            animation:    "pulse 1.5s ease-in-out infinite",
          }} />
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50%       { opacity: 0.5; transform: scale(1.3); }
            }
          `}</style>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1, #111)" }}>
            Anomalies detected
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3, #888)", fontSize: "16px", padding: "0 0 0 8px", lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Severity badges */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        {event.high > 0 && (
          <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: "rgba(248,81,73,0.12)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
            {event.high} HIGH
          </span>
        )}
        {event.medium > 0 && (
          <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: "rgba(210,153,34,0.12)", color: "#d29922", border: "1px solid rgba(210,153,34,0.25)" }}>
            {event.medium} MEDIUM
          </span>
        )}
        {event.low > 0 && (
          <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "5px", background: "rgba(63,185,80,0.12)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.25)" }}>
            {event.low} LOW
          </span>
        )}
        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(88,101,242,0.08)", color: "#5865f2", marginLeft: "auto" }}>
          🔬 {event.method}
        </span>
      </div>

      {/* Top anomalies list */}
      {event.topAnomalies.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {event.topAnomalies.map((a, i) => (
            <div key={i} style={{ fontSize: "12px", color: "var(--t2, #555)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "600", color: "var(--t1, #111)", textTransform: "uppercase" }}>{a.metric}</span>
              <span style={{ color: "var(--t3, #888)" }}>
                {a.campaign !== "unknown" ? a.campaign : ""} · z={a.zScore}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <a href="/anomalies" style={{
        display:        "block",
        marginTop:      "10px",
        fontSize:       "12px",
        fontWeight:     "600",
        color:          "#5865f2",
        textDecoration: "none",
      }}>
        View in Anomalies →
      </a>
    </div>
  );
}
