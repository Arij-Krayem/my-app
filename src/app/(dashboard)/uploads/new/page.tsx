"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Brand {
  id: string;
  name: string;
}

const platformOptions = [
  {
    value: "Google Ads",
    title: "Google Ads",
    description: "Search and campaign exports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 18.5V9.75a2.75 2.75 0 1 1 5.5 0V18.5" stroke="#5865f2" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16.5" cy="16.5" r="3.5" stroke="#5865f2" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    value: "Meta Ads",
    title: "Meta Ads",
    description: "Facebook and Instagram exports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 15.5c1.6-5.2 3.6-7.8 5.8-7.8 2.3 0 3.2 6.8 5 6.8 1.2 0 2.4-2.2 5.2-7"
          stroke="#5865f2"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function NewUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("Google Ads");
  const [brand, setBrand] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
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
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? [];
        setBrands(list);
        if (list.length > 0) setBrand(list[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) setSelectedFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) setSelectedFile(files[0]);
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
        headers: { Authorization: `Bearer ${token}` },
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
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="dashboard-page">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h1 className={`dashboard-title ${styles.title}`}>New Upload</h1>
          <p className={`dashboard-subtitle ${styles.subtitle}`}>Upload your Google Ads or Meta CSV data to start monitoring</p>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>1</span>
            <h2 className={styles.sectionTitle}>Upload CSV File</h2>
          </div>

          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ""}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
          >
            <div className={styles.uploadIcon}>
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
            <h3 className={styles.dropTitle}>Drop your CSV file here</h3>
            <p className={styles.dropCopy}>or click to browse from your computer</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="file-input" />
            <label htmlFor="file-input" className={`btn-primary cursor-pointer inline-block ${styles.chooseButton}`}>
              Choose File
            </label>
          </div>

          {selectedFile && (
            <div className={styles.selectedFile}>
              <div className={styles.selectedFileRow}>
                <div>
                  <p className={styles.fileName}>{selectedFile.name}</p>
                  <p className={styles.fileSize}>{formatFileSize(selectedFile.size)}</p>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className={styles.removeButton}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.sectionCard}>
          <div className={`${styles.sectionHeader} ${styles.sectionHeaderTight}`}>
            <span className={styles.sectionBadge}>2</span>
            <h2 className={styles.sectionTitle}>Select Platform</h2>
          </div>

          <div className={styles.platformGrid}>
            {platformOptions.map(option => (
              <label key={option.value} className={`${styles.platformCard} ${platform === option.value ? styles.platformActive : ""}`}>
                <input
                  type="radio"
                  name="platform"
                  value={option.value}
                  checked={platform === option.value}
                  onChange={e => setPlatform(e.target.value)}
                  className="sr-only"
                />
                <div className={styles.platformRow}>
                  <div className={styles.platformInfo}>
                    <span className={styles.platformIcon}>{option.icon}</span>
                    <div>
                      <div className={styles.platformName}>{option.title}</div>
                      <div className={styles.platformDescription}>{option.description}</div>
                    </div>
                  </div>
                  <span className={styles.radioDot} />
                </div>
              </label>
            ))}
          </div>
        </div>

        {brands.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={`${styles.sectionHeader} ${styles.sectionHeaderTight}`}>
              <span className={styles.sectionBadge}>3</span>
              <h2 className={styles.sectionTitle}>Select Brand</h2>
            </div>
            <select value={brand} onChange={e => setBrand(e.target.value)} className={`w-full input-field ${styles.brandSelect}`} required>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="submit"
            className={`btn-primary ${styles.submitButton} ${loading || !selectedFile ? styles.submitDisabled : ""}`}
            disabled={loading || !selectedFile}
          >
            {loading ? (
              <div className={styles.loadingInline}>
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
