"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./page.module.css";

const TARGET_COLUMNS = [
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
  { value: "adset_name", label: "Ad Set Name" },
  { value: "platform", label: "Platform" },
  { value: "conversion_value", label: "Conv. Value" },
  { value: "conversions", label: "Conversions" },
];

interface UploadColumn {
  id?: string;
  name: string;
  sample?: string[];
  mappedTo?: string | null;
}

interface UploadMapping {
  sourceColumn: string;
  targetKey: string;
}

interface Upload {
  columns?: UploadColumn[];
  mappings?: UploadMapping[];
}

export default function ColumnMappingPage() {
  const [upload, setUpload] = useState<Upload | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const uploadId = params.id as string;

  useEffect(() => { fetchUpload(); }, [uploadId]);

  const fetchUpload = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) { setUpload(null); return; }
      const data = await res.json();
      const u: Upload = data.upload ?? data;
      setUpload(u);

      const init: Record<string, string> = {};
      u?.columns?.forEach(col => {
        if (col.mappedTo) init[col.name] = col.mappedTo;
      });
      u?.mappings?.forEach(m => {
        init[m.sourceColumn] = m.targetKey;
      });
      setMappings(init);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const autoMap = () => {
    if (!upload?.columns) return;
    const auto: Record<string, string> = {};
    upload.columns.forEach(col => {
      const h = col.name.toLowerCase();
      if (h.includes("spend") || h.includes("amount spent") || h === "cost") auto[col.name] = "spend";
      else if (h.includes("link click") || h === "clicks") auto[col.name] = "clicks";
      else if (h.includes("impression")) auto[col.name] = "impressions";
      else if (h.includes("roas") || h.includes("return on ad")) auto[col.name] = "roas";
      else if (h.includes("ctr")) auto[col.name] = "ctr";
      else if (h.includes("cpc") || h.includes("cost per")) auto[col.name] = "cpc";
      else if (h.includes("cpa")) auto[col.name] = "cpa";
      else if (h === "date" || h === "day" || h.includes("reporting")) auto[col.name] = "date";
      else if (h.includes("campaign") && h.includes("name")) auto[col.name] = "campaign_name";
      else if (h === "campaign") auto[col.name] = "campaign_name";
      else if (h.includes("ad set") || h.includes("adset") || h === "ad group") auto[col.name] = "adset_name";
      else if (h.includes("conversion") && h.includes("value")) auto[col.name] = "conversion_value";
      else if (h.includes("conversion") || h.includes("purchase")) auto[col.name] = "conversions";
    });
    setMappings(prev => ({ ...prev, ...auto }));
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const token = sessionStorage.getItem("access_token");
      const mappingList = Object.entries(mappings)
        .filter(([, v]) => v !== "")
        .map(([sourceColumn, targetKey]) => ({ sourceColumn, targetKey }));

      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ mappings: mappingList }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        const res2 = await fetch(`/api/uploads/${uploadId}/mapping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          credentials: "include",
          body: JSON.stringify({ mappings: mappingList }),
        });
        if (res2.ok) setSaved(true);
        else { const e = await res2.json(); setError(e.error || e.message || "Failed to save"); }
      }
    } catch {
      setError("Failed to save mappings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true); setError("");
    try {
      const token = sessionStorage.getItem("access_token");
      const res = await fetch(`/api/uploads/${uploadId}/ingest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.ingested} rows ingested successfully`);
        router.push("/uploads");
      } else {
        setError(data.error || "Ingest failed");
      }
    } catch {
      setError("Ingest failed. Please try again.");
    } finally {
      setIngesting(false);
    }
  };

  const mappedCount = Object.values(mappings).filter(v => v !== "").length;
  const totalCols = upload?.columns?.length ?? 0;
  const pct = totalCols > 0 ? Math.round((mappedCount / totalCols) * 100) : 0;

  if (loading) return (
    <div className={styles.loadingShell}>
      <div className={styles.loader} />
    </div>
  );

  if (!upload) return <div className={styles.notFound}>Upload not found.</div>;

  return (
    <div className={`dashboard-page dashboard-page--narrow ${styles.page}`}>
      {error && <div className={`${styles.banner} ${styles.errorBanner}`}>⚠ {error}</div>}

      {saved && (
        <div className={`${styles.banner} ${styles.successBanner}`}>
          ✅ Mappings saved! Click <strong>Ingest Data</strong> to load rows into the analytics database.
        </div>
      )}

      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressTitle}>Mapping Progress</span>
          <span className={styles.progressCount}>{mappedCount} / {totalCols} columns mapped</span>
        </div>
        <progress className={styles.progress} value={pct} max={100} />
      </div>

      <div className={styles.autoMapRow}>
        <button onClick={autoMap} className={styles.autoMapButton}>
          ✨ Auto-Map Columns
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={`${styles.grid} ${styles.tableHead}`}>
          {["Your Column", "Sample Data", "Map To"].map(h => (
            <span key={h} className={styles.headCell}>{h}</span>
          ))}
        </div>
        {upload.columns?.map(col => (
          <div key={col.id ?? col.name} className={`${styles.grid} ${styles.row}`}>
            <span className={styles.columnName}>{col.name}</span>
            <span className={styles.sample}>
              {Array.isArray(col.sample) ? col.sample.slice(0, 3).join(", ") : ""}
            </span>
            <select
              value={mappings[col.name] ?? ""}
              onChange={e => setMappings(prev => ({ ...prev, [col.name]: e.target.value }))}
              className={`${styles.select} ${mappings[col.name] ? styles.selectMapped : ""}`}
            >
              <option value="">-- Select --</option>
              {TARGET_COLUMNS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button onClick={() => router.push("/uploads")} className={styles.cancelButton}>
          ← Cancel
        </button>
        <div className={styles.actionGroup}>
          <button
            onClick={handleSave}
            disabled={saving || mappedCount === 0}
            className={`${styles.saveButton} ${saved ? styles.saveButtonSaved : ""} ${mappedCount === 0 ? styles.disabled : ""}`}
          >
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Mappings"}
          </button>
          {saved && (
            <button onClick={handleIngest} disabled={ingesting} className={`${styles.ingestButton} ${ingesting ? styles.disabled : ""}`}>
              {ingesting ? (
                <><div className={styles.spinnerSmall} />Ingesting...</>
              ) : "🚀 Ingest Data"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
