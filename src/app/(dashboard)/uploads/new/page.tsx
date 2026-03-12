"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  { value: "Google Ads", label: "Google Ads", desc: "Search and campaign exports",      initial: "G", color: "#4285F4", bg: "rgba(66,133,244,0.08)",  border: "rgba(66,133,244,0.35)" },
  { value: "Meta Ads",   label: "Meta Ads",   desc: "Facebook and Instagram exports",   initial: "f", color: "#1877F2", bg: "rgba(24,119,242,0.08)",  border: "rgba(24,119,242,0.35)" },
];

export default function NewUploadPage() {
  const router = useRouter();
  const [file, setFile]         = useState<File | null>(null);
  const [platform, setPlatform] = useState("Google Ads");
  const [brand, setBrand]       = useState("");
  const [brands, setBrands]     = useState<{ id: string; name: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    fetch("/api/brands", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: { id: string; name: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBrands(data);
          setBrand(String(data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file)  { setError("Please select a CSV file.");  return; }
    if (!brand) { setError("Please select a brand.");     return; }

    setLoading(true);

    const fd = new FormData();
    fd.append("file",     file);
    fd.append("platform", platform);
    fd.append("brandId",  brand);

    try {
      const token = sessionStorage.getItem("access_token");
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: fd,
      });

      const data = await res.json();

      if (res.ok) {
        // API now returns flat object: { id, status, brandId, ... }
        router.push(`/uploads/${data.id}/mapping`);
      } else {
        setError(data.error || data.message || "Upload failed — please try again.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fmtSize = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both", fontFamily: "'Outfit', sans-serif", maxWidth: "720px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>New Upload</h1>
        <p style={{ fontSize: "14px", color: "var(--t2)" }}>Upload your Google Ads or Meta CSV data to start monitoring</p>
      </div>

      {/* Inline error banner */}
      {error && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "10px", background: "rgba(248,81,73,0.07)", border: "1px solid rgba(248,81,73,0.3)", color: "#f85149", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Step 1 — File */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>1</div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>Upload CSV File</h3>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setDragging(false); }}
            onDrop={handleDrop}
            onClick={() => !file && document.getElementById("file-input")?.click()}
            style={{ border: `2px dashed ${dragging ? "#5865f2" : file ? "rgba(88,101,242,0.4)" : "var(--border)"}`, borderRadius: "14px", padding: "52px 24px", textAlign: "center", background: dragging ? "rgba(88,101,242,0.04)" : file ? "rgba(88,101,242,0.03)" : "var(--bg)", transition: "all 0.2s", cursor: file ? "default" : "pointer" }}
          >
            {file ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(88,101,242,0.1)", border: "1px solid rgba(88,101,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)", marginBottom: "2px" }}>{file.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--t2)" }}>{fmtSize(file.size)} · CSV</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                  style={{ padding: "5px 14px", borderRadius: "8px", border: "1px solid rgba(248,81,73,0.3)", background: "rgba(248,81,73,0.07)", color: "#f85149", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div style={{ color: "var(--t3)", display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--t1)", marginBottom: "6px" }}>Drop your CSV file here</p>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "20px" }}>or click to browse from your computer</p>
                <input type="file" accept=".csv" id="file-input" style={{ display: "none" }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                <button type="button" onClick={e => { e.stopPropagation(); document.getElementById("file-input")?.click(); }}
                  style={{ padding: "10px 24px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(88,101,242,0.3)" }}>
                  Choose File
                </button>
              </>
            )}
          </div>
        </div>

        {/* Step 2 — Platform */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>2</div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>Select Platform</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {PLATFORMS.map(p => {
              const active = platform === p.value;
              return (
                <div key={p.value} onClick={() => setPlatform(p.value)} style={{ padding: "18px 20px", borderRadius: "14px", border: `2px solid ${active ? p.color : "var(--border)"}`, background: active ? p.bg : "var(--bg)", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "14px", boxShadow: active ? `0 4px 16px ${p.color}22` : "none" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "800", fontSize: "20px", flexShrink: 0 }}>{p.initial}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: active ? p.color : "var(--t1)", marginBottom: "2px" }}>{p.label}</p>
                    <p style={{ fontSize: "11px", color: "var(--t3)" }}>{p.desc}</p>
                  </div>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${active ? p.color : "var(--border)"}`, background: active ? p.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3 — Brand */}
        {brands.length > 0 && (
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "28px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg,#5865f2,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>3</div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)" }}>Select Brand</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
              {brands.map(b => {
                const active = brand === String(b.id);
                return (
                  <div key={b.id} onClick={() => setBrand(String(b.id))} style={{ padding: "14px 16px", borderRadius: "12px", border: `2px solid ${active ? "#5865f2" : "var(--border)"}`, background: active ? "rgba(88,101,242,0.07)" : "var(--bg)", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: active ? "linear-gradient(135deg,#5865f2,#818cf8)" : "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "white" : "var(--t3)", fontWeight: "700", fontSize: "13px", flexShrink: 0 }}>{b.name[0]}</div>
                    <span style={{ fontSize: "13px", fontWeight: active ? "700" : "500", color: active ? "#5865f2" : "var(--t1)" }}>{b.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" onClick={() => router.back()}
            style={{ padding: "11px 22px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--t2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#5865f2"; (e.currentTarget as HTMLElement).style.color = "#5865f2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--t2)"; }}>
            ← Cancel
          </button>
          <button type="submit" disabled={loading || !file}
            style={{ padding: "12px 32px", background: "linear-gradient(135deg,#5865f2,#818cf8)", border: "none", borderRadius: "10px", color: "white", fontSize: "14px", fontWeight: "700", cursor: loading || !file ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: file ? "0 4px 16px rgba(88,101,242,0.35)" : "none", opacity: !file ? 0.5 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? (
              <><div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />Uploading...</>
            ) : <>Upload &amp; Continue →</>}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}