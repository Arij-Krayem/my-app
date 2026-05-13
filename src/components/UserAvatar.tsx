"use client";

import Image from "next/image";
import styles from "./UserAvatar.module.css";

const sizeClass: Record<number, string> = {
  32: styles.size32,
  38: styles.size38,
  40: styles.size40,
  44: styles.size44,
  48: styles.size48,
  56: styles.size56,
};

const radiusClass: Record<string, string> = {
  "12": styles.radius12,
  "14": styles.radius14,
  "999": styles.radiusRound,
};

const fontClass: Record<number, string> = {
  13: styles.font13,
  14: styles.font14,
  15: styles.font15,
  18: styles.font18,
  20: styles.font20,
};

const colorClass = [
  styles.colorIndigo,
  styles.colorGreen,
  styles.colorRed,
  styles.colorAmber,
  styles.colorSky,
  styles.colorViolet,
];

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  borderRadius?: number | string;
  fontSize?: number;
  colorIndex?: number;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  if (!source) return "?";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return parts.map(part => part[0]).join("").toUpperCase().slice(0, 2);
  }

  return source[0].toUpperCase();
}

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 40,
  borderRadius = 12,
  fontSize = Math.max(12, Math.round(size * 0.34)),
  colorIndex = 0,
  className,
}: UserAvatarProps) {
  const initials = getInitials(name, email);
  const rootClassName = [
    styles.avatar,
    sizeClass[size] ?? styles.size40,
    radiusClass[String(borderRadius)] ?? styles.radius12,
    className,
  ].filter(Boolean).join(" ");

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name ?? email ?? "User avatar"}
        width={size}
        height={size}
        unoptimized
        className={`${rootClassName} ${styles.image}`}
      />
    );
  }

  const fallbackClassName = [
    rootClassName,
    styles.fallback,
    fontClass[fontSize] ?? styles.font14,
    colorClass[colorIndex % colorClass.length],
  ].filter(Boolean).join(" ");

  return (
    <div className={fallbackClassName}>
      {initials}
    </div>
  );
}
