"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import styles from "./AnomalyToast.module.css";

interface AnomalyEvent {
  brandId: string;
  uploadId: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  method: string;
  topAnomalies: {
    metric: string;
    severity: string;
    zScore: number;
    campaign: string;
  }[];
}

interface Toast {
  id: string;
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

    socket.on("anomalies:detected", (event: AnomalyEvent) => {
      console.log("[AnomalyToast] Received event:", event);
      const toast: Toast = { id: `${Date.now()}-${Math.random()}`, event };
      setToasts(prev => [...prev, toast]);

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
    <div className={styles.toastStack}>
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
  const hasHigh = event.high > 0;
  const severityClass = hasHigh ? styles.cardHigh : styles.cardWarning;

  return (
    <div className={`${styles.toastCard} ${severityClass}`}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.pulseDot} />
          <span className={styles.title}>Anomalies detected</span>
        </div>
        <button onClick={onDismiss} className={styles.dismissButton} aria-label="Dismiss anomaly toast">
          &times;
        </button>
      </div>

      <div className={styles.badgeRow}>
        {event.high > 0 && (
          <span className={`${styles.badge} ${styles.badgeHigh}`}>
            {event.high} HIGH
          </span>
        )}
        {event.medium > 0 && (
          <span className={`${styles.badge} ${styles.badgeMedium}`}>
            {event.medium} MEDIUM
          </span>
        )}
        {event.low > 0 && (
          <span className={`${styles.badge} ${styles.badgeLow}`}>
            {event.low} LOW
          </span>
        )}
        <span className={styles.methodBadge}>
          🔬 {event.method}
        </span>
      </div>

      {event.topAnomalies.length > 0 && (
        <div className={styles.anomalyList}>
          {event.topAnomalies.map((a, i) => (
            <div key={i} className={styles.anomalyRow}>
              <span className={styles.metric}>{a.metric}</span>
              <span className={styles.campaign}>
                {a.campaign !== "unknown" ? a.campaign : ""} &middot; z={a.zScore}
              </span>
            </div>
          ))}
        </div>
      )}

      <a href="/anomalies" className={styles.cta}>
        View in Anomalies &rarr;
      </a>
    </div>
  );
}
