"use client";

import { useEffect, useState } from "react";
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
        setBrands(data);
        if (data.length > 0) {
          setBrand(data[0].id);
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
    formData.append("platform", platform);
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
        router.push(`/uploads/${data.id}/mapping`);
      } else {
        const error = await response.json();
        alert(error.message || "Upload failed");
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

  return (
    <div className="animate-fadeUp">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--t1)" }}>
          New Upload
        </h1>
        <p style={{ color: "var(--t2)" }}>
          Upload your Google Ads or Meta CSV data to start monitoring
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drag & Drop Zone */}
        <div className="card">
          <div
            className="border-2 border-dashed rounded-2xl text-center transition-all"
            style={{
              borderColor: "var(--border)",
              borderStyle: "dashed",
              borderWidth: "2px",
              borderRadius: "16px",
              padding: "60px",
              width: "100%",
              background: isDragging ? "var(--accent-glow)" : "var(--bg)"
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--t1)" }}>
              Drop your CSV file here
            </h3>
            <p style={{ color: "var(--t2)" }} className="mb-4">
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
            >
              Choose File
            </label>
          </div>

          {selectedFile && (
            <div className="mt-6 p-4 rounded-lg" style={{ background: "var(--bg)" }}>
              <div className="flex items-center justify-between">
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
                  className="text-sm hover:underline"
                  style={{ color: "var(--danger)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
            Select Platform
          </h3>
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                platform === "Google Ads"
                  ? "border-blue-500"
                  : ""
              }`}
              style={{
                padding: "20px 32px",
                borderRadius: "12px",
                border: "2px solid var(--border)",
                borderColor: platform === "Google Ads" ? "var(--accent)" : "var(--border)",
                background: platform === "Google Ads" ? "rgba(88,101,242,0.1)" : "transparent"
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
              <div className="text-2xl mr-3">🔍</div>
              <div className="font-medium" style={{ color: "var(--t1)" }}>
                Google Ads
              </div>
            </label>

            <label
              className={`flex-1 flex items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
                platform === "Meta Ads"
                  ? "border-blue-500"
                  : ""
              }`}
              style={{
                padding: "20px 32px",
                borderRadius: "12px",
                border: "2px solid var(--border)",
                borderColor: platform === "Meta Ads" ? "var(--accent)" : "var(--border)",
                background: platform === "Meta Ads" ? "rgba(88,101,242,0.1)" : "transparent"
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
              <div className="text-2xl mr-3">📘</div>
              <div className="font-medium" style={{ color: "var(--t1)" }}>
                Meta Ads
              </div>
            </label>
          </div>
        </div>

        {/* Brand Selection */}
        {brands.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--t1)" }}>
              Select Brand
            </h3>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full"
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--input)"
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary px-8 py-4"
            disabled={loading || !selectedFile}
            style={{ marginTop: "32px" }}
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
