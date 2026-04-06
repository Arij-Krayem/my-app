"use client";

import { CSSProperties, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("Google Ads");
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBrands();
  }, []);

  const normalizePlatform = (value: string) => {
    if (value === "Google Ads") return "GOOGLE";
    if (value === "Meta Ads") return "META";
    return value;
  };

  const fetchBrands = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch("/api/brands", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? [];
        setBrands(list);
        if (list.length > 0) {
          setBrand(list[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("platform", normalizePlatform(platform));
    formData.append("brandId", brand);

    try {
      const token = sessionStorage.getItem("access_token");
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/uploads/${data.upload.id}/mapping`);
      } else {
        const error = await response.json();
        alert(error.error || error.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const sectionCardStyle: CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    boxShadow: "0 1px 2px rgba(15,23,42,.04)",
    padding: "28px 30px",
  };

  const sectionBadgeStyle: CSSProperties = {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    background: "#5865f2",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    boxShadow: "0 10px 20px rgba(88,101,242,.18)",
    flexShrink: 0,
  };

  return (
    <div className="dashboard-page">
      <form onSubmit={handleSubmit} style={{ maxWidth: "800px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ textAlign: "left" }}>
          <h1 className="dashboard-title" style={{ marginTop: 0 }}>New Upload</h1>
          <p className="dashboard-subtitle" style={{ marginTop: "6px" }}>Upload your Google Ads or Meta CSV data to start monitoring</p>
        </div>

        <div style={sectionCardStyle}>
          <div className="flex items-center gap-3" style={{ marginBottom: "22px" }}>
            <span style={sectionBadgeStyle}>1</span>
            <h2 className="text-lg font-semibold" style={{ color: "var(--t1)", fontSize: "18px", fontWeight: 800 }}>
              Upload CSV File
            </h2>
          </div>

          <div
            className="text-center transition-all"
            style={{
              border: "2px dashed",
              borderColor: isDragging ? "rgba(88,101,242,0.45)" : "rgba(148,163,184,0.22)",
              borderRadius: "18px",
              padding: "56px 24px",
              width: "100%",
              minHeight: "292px",
              background: isDragging ? "rgba(88,101,242,0.04)" : "#f8fafc",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div style={{ marginBottom: "18px", color: "#a6afc5" }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5M5 14.5v3a2.5 2.5 0 0 0 2.5 2.5h9a2.5 2.5 0 0 0 2.5-2.5v-3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--t1)", letterSpacing: "-0.02em", fontWeight: 800 }}>
              Drop your CSV file here
            </h3>
            <p style={{ color: "var(--t2)", fontSize: "15px" }} className="mb-6">
              or click to browse from your computer
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="btn-primary cursor-pointer inline-block"
              style={{ minWidth: "128px", textAlign: "center" }}
            >
              Choose File
            </label>
          </div>

          {selectedFile && (
            <div
              className="mt-5 p-4 rounded-2xl"
              style={{ background: "#f8fafc", border: "1px solid rgba(148,163,184,0.14)" }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium" style={{ color: "var(--t1)" }}>
                    {selectedFile.name}
                  </p>
                  <p className="text-sm" style={{ color: "var(--t2)" }}>
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-sm"
                  style={{ color: "var(--danger)", fontWeight: 700 }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div className="flex items-center gap-3" style={{ marginBottom: "18px" }}>
            <span style={sectionBadgeStyle}>2</span>
            <h2 className="text-lg font-semibold" style={{ color: "var(--t1)", fontSize: "18px", fontWeight: 800 }}>
              Select Platform
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label
              className="cursor-pointer transition-all"
              style={{
                padding: "20px",
                borderRadius: "16px",
                border: "2px solid",
                borderColor: platform === "Google Ads" ? "var(--accent)" : "rgba(148,163,184,0.18)",
                background: platform === "Google Ads" ? "rgba(88,101,242,0.08)" : "#f8fafc",
                boxShadow: platform === "Google Ads" ? "0 10px 20px rgba(88,101,242,0.12)" : "none",
              }}
            >
              <input
                type="radio"
                name="platform"
                value="Google Ads"
                checked={platform === "Google Ads"}
                onChange={(e) => setPlatform(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(88,101,242,0.12)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 18.5V9.75a2.75 2.75 0 1 1 5.5 0V18.5" stroke="#5865f2" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="16.5" cy="16.5" r="3.5" stroke="#5865f2" strokeWidth="1.8" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--t1)", fontSize: "18px" }}>
                      Google Ads
                    </div>
                    <div style={{ color: "var(--t2)", fontSize: "13px" }}>
                      Search and campaign exports
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    border: `2px solid ${platform === "Google Ads" ? "var(--accent)" : "rgba(148,163,184,0.5)"}`,
                    background: platform === "Google Ads" ? "var(--accent)" : "transparent",
                    boxShadow: platform === "Google Ads" ? "inset 0 0 0 3px #fff" : "none",
                    flexShrink: 0,
                  }}
                />
              </div>
            </label>

            <label
              className="cursor-pointer transition-all"
              style={{
                padding: "20px",
                borderRadius: "16px",
                border: "2px solid",
                borderColor: platform === "Meta Ads" ? "var(--accent)" : "rgba(148,163,184,0.18)",
                background: platform === "Meta Ads" ? "rgba(88,101,242,0.08)" : "#f8fafc",
                boxShadow: platform === "Meta Ads" ? "0 10px 20px rgba(88,101,242,0.12)" : "none",
              }}
            >
              <input
                type="radio"
                name="platform"
                value="Meta Ads"
                checked={platform === "Meta Ads"}
                onChange={(e) => setPlatform(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "14px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(88,101,242,0.12)",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4 15.5c1.6-5.2 3.6-7.8 5.8-7.8 2.3 0 3.2 6.8 5 6.8 1.2 0 2.4-2.2 5.2-7"
                        stroke="#5865f2"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--t1)", fontSize: "18px" }}>
                      Meta Ads
                    </div>
                    <div style={{ color: "var(--t2)", fontSize: "13px" }}>
                      Facebook and Instagram exports
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    border: `2px solid ${platform === "Meta Ads" ? "var(--accent)" : "rgba(148,163,184,0.5)"}`,
                    background: platform === "Meta Ads" ? "var(--accent)" : "transparent",
                    boxShadow: platform === "Meta Ads" ? "inset 0 0 0 3px #fff" : "none",
                    flexShrink: 0,
                  }}
                />
              </div>
            </label>
          </div>
        </div>

        {brands.length > 0 && (
          <div style={sectionCardStyle}>
            <div className="flex items-center gap-3" style={{ marginBottom: "18px" }}>
              <span style={sectionBadgeStyle}>3</span>
              <h2 className="text-lg font-semibold" style={{ color: "var(--t1)", fontSize: "18px", fontWeight: 800 }}>
                Select Brand
              </h2>
            </div>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full input-field"
              style={{
                minHeight: "52px",
                borderRadius: "14px",
                background: "#f8fafc",
              }}
              required
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary px-8 py-4"
            disabled={loading || !selectedFile}
            style={{
              marginTop: "8px",
              minWidth: "184px",
              opacity: loading || !selectedFile ? 0.65 : 1,
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="loading-spinner"></div>
                Uploading...
              </div>
            ) : (
              "Upload & Continue"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
