"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import StepCard from "@/components/ui/StepCard";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import { btnPrimary, btnSecondary } from "@/lib/styles";

interface BrandOption {
  id: string;
  name: string;
}

export default function NewUploadPage(): React.ReactElement {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<string>(PLATFORM_OPTIONS[0].value);
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    fetch("/api/brands", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const items = Array.isArray(data) ? (data as BrandOption[]) : [];
        if (items.length > 0) {
          setBrands(items);
          setBrand(String(items[0].id));
        }
      })
      .catch(() => setBrands([]));
  }, []);

  const handleDrop = (event: React.DragEvent): void => {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files[0];
    if (nextFile?.name.endsWith(".csv")) setFile(nextFile);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a CSV file.");
      return;
    }

    if (!brand) {
      setError("Please select a brand.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("platform", platform);
    formData.append("brandId", brand);

    try {
      const token = sessionStorage.getItem("access_token");
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; id?: string; message?: string };

      if (response.ok && data.id) {
        router.push(`/uploads/${data.id}/mapping`);
      } else {
        setError(data.error || data.message || "Upload failed. Please try again.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number): string =>
    bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      <div style={{ marginBottom: "22px", padding: "18px 20px", borderRadius: "16px", background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,248,255,0.94) 100%)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
          Upload flow
        </p>
        <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: 1.6 }}>
          Upload your Google Ads or Meta CSV data, choose the correct platform, then continue to mapping.
        </p>
      </div>

      {error ? (
        <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "10px", background: "rgba(248,81,73,0.07)", border: "1px solid rgba(248,81,73,0.3)", color: "#f85149", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f85149", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>
            ×
          </button>
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)}>
        <StepCard step={1} title="Upload CSV File">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => {
              if (!file) document.getElementById("file-input")?.click();
            }}
            style={{ border: `2px dashed ${dragging ? "#5865f2" : file ? "rgba(88,101,242,0.4)" : "var(--border)"}`, borderRadius: "14px", padding: "52px 24px", textAlign: "center", background: dragging ? "rgba(88,101,242,0.04)" : file ? "rgba(88,101,242,0.03)" : "var(--bg)", transition: "all 0.2s", cursor: file ? "default" : "pointer" }}
          >
            {file ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(88,101,242,0.1)", border: "1px solid rgba(88,101,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)", marginBottom: "2px" }}>{file.name}</p>
                  <p style={{ fontSize: "12px", color: "var(--t2)" }}>{formatSize(file.size)} - CSV</p>
                </div>
                <button type="button" onClick={(event) => { event.stopPropagation(); setFile(null); }} style={{ ...btnSecondary, borderColor: "rgba(248,81,73,0.3)", background: "rgba(248,81,73,0.07)", color: "#f85149", padding: "5px 14px", fontSize: "12px" }}>
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div style={{ color: "var(--t3)", display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--t1)", marginBottom: "6px" }}>Drop your CSV file here</p>
                <p style={{ fontSize: "13px", color: "var(--t2)", marginBottom: "20px" }}>or click to browse from your computer</p>
                <input type="file" accept=".csv" id="file-input" style={{ display: "none" }} onChange={(event) => event.target.files?.[0] && setFile(event.target.files[0])} />
                <button type="button" onClick={(event) => { event.stopPropagation(); document.getElementById("file-input")?.click(); }} style={btnPrimary}>
                  Choose File
                </button>
              </>
            )}
          </div>
        </StepCard>

        <StepCard step={2} title="Select Platform">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {PLATFORM_OPTIONS.map((option) => {
              const active = platform === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPlatform(option.value)}
                  style={{ padding: "18px 20px", borderRadius: "14px", border: `2px solid ${active ? option.color : "var(--border)"}`, background: active ? option.bg : "var(--bg)", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "14px", boxShadow: active ? `0 4px 16px ${option.color}22` : "none", textAlign: "left" }}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: option.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 800, fontSize: "20px", flexShrink: 0 }}>
                    {option.initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: active ? option.color : "var(--t1)", marginBottom: "2px" }}>{option.label}</p>
                    <p style={{ fontSize: "11px", color: "var(--t3)" }}>{option.desc}</p>
                  </div>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${active ? option.color : "var(--border)"}`, background: active ? option.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </StepCard>

        {brands.length > 0 ? (
          <StepCard step={3} title="Select Brand">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
              {brands.map((item) => {
                const active = brand === String(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBrand(String(item.id))}
                    style={{ padding: "14px 16px", borderRadius: "12px", border: `2px solid ${active ? "#5865f2" : "var(--border)"}`, background: active ? "rgba(88,101,242,0.07)" : "var(--bg)", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: active ? "linear-gradient(135deg,#5865f2,#818cf8)" : "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#ffffff" : "var(--t3)", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                      {item.name[0]}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "#5865f2" : "var(--t1)" }}>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </StepCard>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" onClick={() => router.back()} style={btnSecondary}>
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            style={{ ...btnPrimary, opacity: !file ? 0.5 : 1, cursor: loading || !file ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            {loading ? (
              <>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#ffffff", animation: "spin 0.7s linear infinite" }} />
                Uploading...
              </>
            ) : (
              "Upload & Continue"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
