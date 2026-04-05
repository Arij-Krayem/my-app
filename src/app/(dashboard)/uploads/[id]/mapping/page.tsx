"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

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

export default function ColumnMappingPage() {
  const [upload, setUpload] = useState<any>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const uploadId = params.id as string;

  const fetchUpload = useCallback(async () => {
    try {
      const data = await apiFetch<any>(`/api/uploads/${uploadId}`);
      const nextUpload = data.upload ?? data;
      setUpload(nextUpload);

      const initialMappings: Record<string, string> = {};
      nextUpload?.columns?.forEach((col: any) => {
        if (col.mappedTo) initialMappings[col.name] = col.mappedTo;
      });
      nextUpload?.mappings?.forEach((mapping: any) => {
        initialMappings[mapping.sourceColumn] = mapping.targetKey;
      });
      setMappings(initialMappings);
    } catch (fetchError) {
      console.error(fetchError);
      setUpload(null);
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    fetchUpload();
  }, [fetchUpload]);
  const autoMap = () => {
    if (!upload?.columns) return;
    const auto: Record<string, string> = {};
    upload.columns.forEach((col: any) => {
      const header = col.name.toLowerCase();
      if (header.includes("spend") || header.includes("amount spent") || header === "cost") auto[col.name] = "spend";
      else if (header.includes("link click") || header === "clicks") auto[col.name] = "clicks";
      else if (header.includes("impression")) auto[col.name] = "impressions";
      else if (header.includes("roas") || header.includes("return on ad")) auto[col.name] = "roas";
      else if (header.includes("ctr")) auto[col.name] = "ctr";
      else if (header.includes("cpc") || header.includes("cost per")) auto[col.name] = "cpc";
      else if (header.includes("cpa")) auto[col.name] = "cpa";
      else if (header === "date" || header === "day" || header.includes("reporting")) auto[col.name] = "date";
      else if (header.includes("campaign") && header.includes("name")) auto[col.name] = "campaign_name";
      else if (header === "campaign") auto[col.name] = "campaign_name";
      else if (header.includes("ad set") || header.includes("adset") || header === "ad group") auto[col.name] = "adset_name";
      else if (header.includes("conversion") && header.includes("value")) auto[col.name] = "conversion_value";
      else if (header.includes("conversion") || header.includes("purchase")) auto[col.name] = "conversions";
    });
    setMappings((prev) => ({ ...prev, ...auto }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const mappingList = Object.entries(mappings)
      .filter(([, value]) => value !== "")
      .map(([sourceColumn, targetKey]) => ({ sourceColumn, targetKey }));

    try {
      await apiFetch(`/api/uploads/${uploadId}`, {
        method: "PATCH",
        body: JSON.stringify({ mappings: mappingList }),
      });
      setSaved(true);
    } catch {
      try {
        await apiFetch(`/api/uploads/${uploadId}/mapping`, {
          method: "POST",
          body: JSON.stringify({ mappings: mappingList }),
        });
        setSaved(true);
      } catch (fallbackError) {
        setError(fallbackError instanceof Error ? fallbackError.message : "Failed to save mappings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    setError("");
    try {
      const data = await apiFetch<{ ingested: number }>(`/api/uploads/${uploadId}/ingest`, {
        method: "POST",
      });
      alert(`Successfully ingested ${data.ingested} rows!`);
      router.push("/uploads");
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "Ingest failed. Please try again.");
    } finally {
      setIngesting(false);
    }
  };

  const mappedCount = Object.values(mappings).filter((value) => value !== "").length;
  const totalCols = upload?.columns?.length ?? 0;
  const pct = totalCols > 0 ? Math.round((mappedCount / totalCols) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!upload) {
    return (
      <div style={{ textAlign: "center", padding: "48px", color: "var(--t2)" }}>
        Upload not found.
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif", maxWidth: "900px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Map Your Columns</h1>
        <p style={{ fontSize: "14px", color: "var(--t2)" }}>
          Match your CSV columns to our unified schema - <strong style={{ color: "var(--t1)" }}>{upload.fileName}</strong> ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {upload.platform}
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", background: "rgba(63,185,80,0.1)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.25)" }}>
          Mappings saved! Click <strong>Ingest Data</strong> to load rows into the analytics database.
        </div>
      )}

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>Mapping Progress</span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#5865f2" }}>{mappedCount} / {totalCols} columns mapped</span>
        </div>
        <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#5865f2,#818cf8)", borderRadius: "3px", transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button
          onClick={autoMap}
          style={{ padding: "9px 18px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px" }}
        >
          Auto-Map Columns
        </button>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", padding: "12px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
          {["Your Column", "Sample Data", "Map To"].map((header) => (
            <span key={header} style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{header}</span>
          ))}
        </div>
        {upload.columns?.map((col: any, index: number) => (
          <div key={col.id ?? col.name} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", padding: "14px 20px", alignItems: "center", gap: "8px", borderBottom: index < upload.columns.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{col.name}</span>
            <span style={{ fontSize: "12px", color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {Array.isArray(col.sample) ? col.sample.slice(0, 3).join(", ") : ""}
            </span>
            <select
              value={mappings[col.name] ?? ""}
              onChange={(event) => setMappings((prev) => ({ ...prev, [col.name]: event.target.value }))}
              style={{ padding: "8px 10px", background: "var(--bg)", border: `1px solid ${mappings[col.name] ? "#5865f2" : "var(--border)"}`, borderRadius: "8px", color: mappings[col.name] ? "var(--t1)" : "var(--t3)", fontSize: "13px", fontFamily: "inherit", outline: "none", cursor: "pointer" }}
            >
              <option value="">-- Select --</option>
              {TARGET_COLUMNS.map((target) => (
                <option key={target.value} value={target.value}>{target.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => router.push("/uploads")}
          style={{ padding: "11px 22px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}
        >
          Cancel
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSave}
            disabled={saving || mappedCount === 0}
            style={{ padding: "11px 24px", background: saved ? "rgba(63,185,80,0.1)" : "var(--card)", border: `1px solid ${saved ? "rgba(63,185,80,0.3)" : "var(--border)"}`, borderRadius: "10px", color: saved ? "#3fb950" : "var(--t1)", fontSize: "14px", fontWeight: "600", cursor: saving || mappedCount === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: mappedCount === 0 ? 0.5 : 1 }}
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Mappings"}
          </button>
          {saved && (
            <button
              onClick={handleIngest}
              disabled={ingesting}
              style={{ padding: "11px 28px", background: "linear-gradient(135deg,#10b981,#34d399)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "700", cursor: ingesting ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: "8px" }}
            >
              {ingesting ? (
                <><div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />Ingesting...</>
              ) : "Ingest Data"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
