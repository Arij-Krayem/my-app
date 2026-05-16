"use client";

import { useEffect, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import styles from "./AvatarUploadField.module.css";

interface AvatarUploadFieldProps {
  currentUrl?: string | null;
  name?: string | null;
  email?: string | null;
  onUploaded: (url: string) => void;
  onRemove: () => void;
  label?: string;
}

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

export default function AvatarUploadField({
  currentUrl,
  name,
  email,
  onUploaded,
  onRemove,
  label = "Profile Picture",
}: AvatarUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(currentUrl ?? null);
    setError("");
  }, [currentUrl]);

  async function handleFile(file: File) {
    setError("");

    if (!ALLOWED.includes(file.type)) {
      setError("Allowed formats: PNG, JPG, SVG, WEBP");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => setPreview((e.target?.result as string) ?? null);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const token = sessionStorage.getItem("access_token") ?? "";
      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      onUploaded(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    onRemove();
  }

  return (
    <div>
      <label className={styles.label}>
        {label} <span className={styles.labelHint}>(PNG, JPG, SVG, WEBP &middot; max 2 MB)</span>
      </label>

      <div className={styles.uploadBox}>
        <UserAvatar name={name} email={email} avatarUrl={preview} size={56} borderRadius={14} fontSize={18} />
        <div className={styles.meta}>
          <p className={styles.title}>
            {preview ? "Profile picture uploaded" : "No profile picture"}
          </p>
          <p className={styles.description}>
            {preview ? "Click Change to replace or Remove to use initials." : "Upload an image to replace the default initials avatar."}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={styles.secondaryButton}
          >
            {uploading ? "Uploading..." : preview ? "Change" : "Upload"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className={styles.removeButton}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className={styles.error}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        className={styles.fileInput}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
