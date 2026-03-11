"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const TARGET_COLUMNS = [
  { value: "spend",         label: "Spend"         },
  { value: "clicks",        label: "Clicks"        },
  { value: "impressions",   label: "Impressions"   },
  { value: "roas",          label: "ROAS"          },
  { value: "ctr",           label: "CTR"           },
  { value: "cpc",           label: "CPC"           },
  { value: "cpa",           label: "CPA"           },
  { value: "date",          label: "Date"          },
  { value: "campaign_id",   label: "Campaign ID"   },
  { value: "campaign_name", label: "Campaign Name" },
  { value: "adset_name",    label: "Ad Set Name"   },
  { value: "platform",      label: "Platform"      },
  { value: "conversion_value", label: "Conv. Value" },
  { value: "conversions",   label: "Conversions"   },
];

export default function ColumnMappingPage() {
  const [upload, setUpload]     = useState<any>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const router   = useRouter();
  const params   = useParams();
  const uploadId = params.id as string;

  useEffect(() => { fetchUpload(); }, [uploadId]);

  const fetchUpload = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;
    try {
      const res  = await fetch(`/api/uploads/${uploadId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) { setUpload(null); return; }
      const data = await res.json();
      const u    = data.upload ?? data;
      setUpload(u);

      // Pre-populate mappings from existing mappings saved by backend
      const init: Record<string, string> = {};
      // First try column.mappedTo
      u?.columns?.forEach((col: any) => {
        if (col.mappedTo) init[col.name] = col.mappedTo;
      });
      // Then overlay with explicit mappings array if present
      u?.mappings?.forEach((m: any) => {
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
    upload.columns.forEach((col: any) => {
      const h = col.name.toLowerCase();
      if (h.includes("spend") || h.includes("amount spent") || h === "cost") auto[col.name] = "spend";
      else if (h.includes("link click") || h === "clicks")                   auto[col.name] = "clicks";
      else if (h.includes("impression"))                                      auto[col.name] = "impressions";
      else if (h.includes("roas") || h.includes("return on ad"))             auto[col.name] = "roas";
      else if (h.includes("ctr"))                                             auto[col.name] = "ctr";
      else if (h.includes("cpc") || h.includes("cost per"))                  auto[col.name] = "cpc";
      else if (h.includes("cpa"))                                             auto[col.name] = "cpa";
      else if (h === "date" || h === "day" || h.includes("reporting"))       auto[col.name] = "date";
      else if (h.includes("campaign") && h.includes("name"))                 auto[col.name] = "campaign_name";
      else if (h === "campaign")                                              auto[col.name] = "campaign_name";
      else if (h.includes("ad set") || h.includes("adset") || h === "ad group") auto[col.name] = "adset_name";
      else if (h.includes("conversion") && h.includes("value"))             auto[col.name] = "conversion_value";
      else if (h.includes("conversion") || h.includes("purchase"))          auto[col.name] = "conversions";
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

      // Try PATCH /api/uploads/[id] first (your backend)
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ mappings: mappingList }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        // Fallback: try POST /api/uploads/[id]/mapping (partner's backend)
        const res2 = await fetch(`/api/uploads/${uploadId}/mapping`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          credentials: "include",
          body: JSON.stringify({ mappings: mappingList }),
        });
        if (res2.ok) setSaved(true);
        else { const e = await res2.json(); setError(e.error || e.message || "Failed to save"); }
      }
    } catch (e) {
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
        alert(`✅ Successfully ingested ${data.ingested} rows!`);
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
  const totalCols   = upload?.columns?.length ?? 0;
  const pct         = totalCols > 0 ? Math.round((mappedCount / totalCols) * 100) : 0;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#5865f2", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!upload) return (
    <div style={{ textAlign: "center", padding: "48px", color: "var(--t2)" }}>
      Upload not found.
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif", maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Map Your Columns</h1>
        <p style={{ fontSize: "14px", color: "var(--t2)" }}>
          Match your CSV columns to our unified schema — <strong style={{ color: "var(--t1)" }}>{upload.fileName}</strong> · {upload.platform}
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)" }}>
          ⚠ {error}
        </div>
      )}

      {saved && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontSize: "13px", background: "rgba(63,185,80,0.1)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.25)" }}>
          ✅ Mappings saved! Click <strong>Ingest Data</strong> to load rows into the analytics database.
        </div>
      )}

      {/* Progress */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)" }}>Mapping Progress</span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#5865f2" }}>{mappedCount} / {totalCols} columns mapped</span>
        </div>
        <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#5865f2,#818cf8)", borderRadius: "3px", transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Auto-map button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button onClick={autoMap}
          style={{ padding: "9px 18px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px" }}>
          ✨ Auto-Map Columns
        </button>
      </div>

      {/* Mapping table */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", padding: "12px 20px", background: "var(--bg)", borderBottom: "1px solid var(--border)", gap: "8px" }}>
          {["Your Column", "Sample Data", "Map To"].map(h => (
            <span key={h} style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{h}</span>
          ))}
        </div>
        {upload.columns?.map((col: any, i: number) => (
          <div key={col.id ?? col.name} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", padding: "14px 20px", alignItems: "center", gap: "8px", borderBottom: i < upload.columns.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{col.name}</span>
            <span style={{ fontSize: "12px", color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {Array.isArray(col.sample) ? col.sample.slice(0, 3).join(", ") : ""}
            </span>
            <select
              value={mappings[col.name] ?? ""}
              onChange={e => setMappings(prev => ({ ...prev, [col.name]: e.target.value }))}
              style={{ padding: "8px 10px", background: "var(--bg)", border: `1px solid ${mappings[col.name] ? "#5865f2" : "var(--border)"}`, borderRadius: "8px", color: mappings[col.name] ? "var(--t1)" : "var(--t3)", fontSize: "13px", fontFamily: "inherit", outline: "none", cursor: "pointer" }}
            >
              <option value="">-- Select --</option>
              {TARGET_COLUMNS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => router.push("/uploads")}
          style={{ padding: "11px 22px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
          ← Cancel
        </button>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleSave} disabled={saving || mappedCount === 0}
            style={{ padding: "11px 24px", background: saved ? "rgba(63,185,80,0.1)" : "var(--card)", border: `1px solid ${saved ? "rgba(63,185,80,0.3)" : "var(--border)"}`, borderRadius: "10px", color: saved ? "#3fb950" : "var(--t1)", fontSize: "14px", fontWeight: "600", cursor: saving || mappedCount === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: mappedCount === 0 ? 0.5 : 1 }}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Mappings"}
          </button>
          {saved && (
            <button onClick={handleIngest} disabled={ingesting}
              style={{ padding: "11px 28px", background: "linear-gradient(135deg,#10b981,#34d399)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "700", cursor: ingesting ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
              {ingesting ? (
                <><div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />Ingesting...</>
              ) : "🚀 Ingest Data"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}