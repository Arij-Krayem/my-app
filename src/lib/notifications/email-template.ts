type StyleValue = string | false | null | undefined;

const joinStyles = (...styles: StyleValue[]) => styles.filter(Boolean).join("");

export const EMAIL_STYLES = {
  logo: {
    table: "border-collapse:collapse;margin:0 auto 14px;",
    cell: "width:48px;height:48px;border-radius:12px;",
    text:
      "display:block;width:48px;height:48px;line-height:48px;text-align:center;color:#ffffff;font-size:22px;font-weight:800;font-family:'Segoe UI',Arial,sans-serif;mso-line-height-rule:exactly;",
  },
  dark: {
    footerRule: "border:none;border-top:1px solid #1f2937;margin:24px 0;",
    footerText: "color:#4b5563;font-size:11px;text-align:center;margin:0;",
  },
  passwordReset: {
    shell:
      "font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0f12;border-radius:16px;color:#fff;",
    header: "text-align:center;margin-bottom:28px;",
    title: "font-size:22px;font-weight:700;margin:0;color:#fff;",
    subtitle: "color:#9ca3af;font-size:14px;margin-top:6px;",
    action:
      "display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#6c63ff,#818cf8);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;",
    note: "color:#6b7280;font-size:12px;text-align:center;margin:0;",
    noteStrong: "color:#9ca3af;",
  },
  monitor: {
    shell:
      "font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0d0f12;border-radius:16px;color:#fff;",
    header: "text-align:center;margin-bottom:28px;",
    title: "font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;text-align:center;",
    intro: "color:#9ca3af;font-size:14px;text-align:center;margin:0 0 24px;",
    introStrong: "color:#fff;",
    panel: "background:#111827;border:1px solid #1f2937;border-radius:12px;",
    thresholdPanel: "padding:20px;margin-bottom:20px;",
    detailsPanel: "padding:16px;margin-bottom:20px;",
    metricGrid: "display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;",
    metricLabel:
      "font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;",
    metricValue: "font-size:18px;font-weight:700;margin:0;",
    detailsLabel:
      "font-size:12px;color:#6b7280;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;",
    detailsText: "font-size:14px;color:#d1d5db;margin:0;",
    action:
      "display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#5865f2,#818cf8);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;",
    workspaceNote: "color:#6b7280;font-size:12px;text-align:center;margin:0;",
    workspaceStrong: "color:#9ca3af;",
    anomalySummary: "display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;",
    anomalyTitle: "font-size:16px;font-weight:700;color:#fff;margin:0 0 4px;",
    anomalyMeta: "font-size:12px;color:#6b7280;margin:0;",
    anomalyScoreWrap: "text-align:right;",
    anomalyScoreLabel:
      "font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 2px;",
    anomalyScore: "font-size:28px;font-weight:800;color:#f85149;margin:0;",
    summaryGrid: "display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;",
    summaryItem: "background:#0d0f12;border-radius:8px;padding:12px;",
    summaryLabel:
      "font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;",
    summaryValue: "font-size:13px;font-weight:600;color:#d1d5db;margin:0;",
    anomalyList: "display:flex;flex-direction:column;gap:10px;",
    anomalyItem: "background:#0d0f12;border-radius:8px;padding:12px;",
    anomalyItemRow: "display:flex;justify-content:space-between;gap:12px;align-items:center;",
    anomalyItemTitle: "font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;",
    anomalyItemMeta: "font-size:12px;color:#9ca3af;margin:0;",
    anomalyItemSeverity: "font-size:12px;font-weight:700;color:#fca5a5;margin:0;",
    anomalyItemValue: "font-size:12px;color:#d1d5db;margin:4px 0 0;",
  },
  approval: {
    body: "margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;",
    shell:
      "max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;",
    hero: "background:linear-gradient(135deg,#5865f2,#818cf8);padding:34px 40px 32px;text-align:center;",
    logoBackground: "rgba(255,255,255,0.22)",
    logoShadow: "box-shadow:0 8px 22px rgba(17,24,39,0.12);",
    heroTitle: "color:white;margin:0;font-size:22px;font-weight:700;",
    heroSubtitle: "color:rgba(255,255,255,0.86);margin:8px 0 0;font-size:14px;",
    content: "padding:40px;",
    greeting: "font-size:16px;color:#111827;margin:0 0 8px;font-weight:600;",
    bodyText: "font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px;",
    approvedStrong: "color:#16a34a;",
    statusBox:
      "background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:10px;",
    statusDot: "width:10px;height:10px;background:#16a34a;border-radius:50%;flex-shrink:0;",
    statusText: "font-size:13px;color:#15803d;font-weight:600;",
    actionWrap: "text-align:center;margin-bottom:28px;",
    action:
      "display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#5865f2,#818cf8);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.01em;",
    accessBox: "background:#f8fafc;border-radius:10px;padding:18px;margin-bottom:24px;",
    accessTitle:
      "font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;",
    accessItem: "display:flex;align-items:center;gap:8px;margin-bottom:8px;",
    accessBullet: "width:6px;height:6px;background:#5865f2;border-radius:50%;flex-shrink:0;",
    accessText: "font-size:13px;color:#374151;",
    note: "font-size:12px;color:#9ca3af;text-align:center;margin:0;",
    footer: "border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;",
    footerText: "font-size:12px;color:#9ca3af;margin:0;",
  },
} as const;

export const EMAIL_THEMES = {
  brandLogoGradient: "linear-gradient(135deg,#6c63ff,#818cf8)",
  alert: {
    CRITICAL: {
      logoColorStops: "#dc2626,#f87171",
      borderColor: "#dc2626",
    },
    WARNING: {
      logoColorStops: "#d97706,#fbbf24",
      borderColor: "#d97706",
    },
  },
  anomaly: {
    logoColorStops: "#f85149,#fca5a5",
    borderColor: "#f85149",
  },
} as const;

interface LogoMarkOptions {
  letter: string;
  background: string;
  extraStyle?: string;
}

export function renderLogoMark({ letter, background, extraStyle = "" }: LogoMarkOptions) {
  const cellStyle = joinStyles(EMAIL_STYLES.logo.cell, `background:${background};`, extraStyle);

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="${EMAIL_STYLES.logo.table}">
    <tr>
      <td width="48" height="48" align="center" valign="middle" style="${cellStyle}">
        <span style="${EMAIL_STYLES.logo.text}">${letter}</span>
      </td>
    </tr>
  </table>
`;
}

export function renderMonitorHeader(letter: string, colorStops: string) {
  return `
  <div style="${EMAIL_STYLES.monitor.header}">
    ${renderLogoMark({ letter, background: `linear-gradient(135deg,${colorStops})` })}
  </div>
`;
}

export function renderDarkFooter() {
  return `
  <hr style="${EMAIL_STYLES.dark.footerRule}" />
  <p style="${EMAIL_STYLES.dark.footerText}">&copy; 2026 VisioAd &middot; Full-Service Brand Advertising Agency</p>
`;
}

export function renderBorderedMonitorPanel(borderColor: string, extraStyle: string) {
  return joinStyles(EMAIL_STYLES.monitor.panel, `border-left:4px solid ${borderColor};`, extraStyle);
}

export function renderMetricValueStyle(color: string) {
  return joinStyles(EMAIL_STYLES.monitor.metricValue, `color:${color};`);
}

export function renderAccessItem(item: string) {
  return `
              <div style="${EMAIL_STYLES.approval.accessItem}">
                <div style="${EMAIL_STYLES.approval.accessBullet}"></div>
                <span style="${EMAIL_STYLES.approval.accessText}">${item}</span>
              </div>
            `;
}
