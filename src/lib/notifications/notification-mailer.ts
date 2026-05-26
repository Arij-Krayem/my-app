import nodemailer from "nodemailer";
import {
  EMAIL_STYLES,
  EMAIL_THEMES,
  renderAccessItem,
  renderBorderedMonitorPanel,
  renderDarkFooter,
  renderLogoMark,
  renderMetricValueStyle,
  renderMonitorHeader,
} from "./email-template";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface AlertEmailData {
  brandName: string;
  metricKey: string;
  value: number;
  operator: string;
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  message: string;
  recipients: string[];
}

interface AnomalyEmailData {
  brandName: string;
  anomalies: {
    metric: string;
    severity: string;
    z_score: number;
    campaign?: string | null;
    platform?: string | null;
    value: number;
  }[];
  recipients: string[];
}

export async function sendAlertEmail(data: AlertEmailData) {
  if (!data.recipients.length) return;

  const isCritical = data.severity === "CRITICAL";
  const theme = EMAIL_THEMES.alert[data.severity];
  const label = isCritical ? "CRITICAL ALERT" : "WARNING ALERT";

  const html = `
    <div style="${EMAIL_STYLES.monitor.shell}">
      ${renderMonitorHeader("V", theme.logoColorStops)}
      <h1 style="${EMAIL_STYLES.monitor.title}">${label}</h1>
      <p style="${EMAIL_STYLES.monitor.intro}">A performance threshold has been breached for <strong style="${EMAIL_STYLES.monitor.introStrong}">${data.brandName}</strong></p>

      <div style="${renderBorderedMonitorPanel(theme.borderColor, EMAIL_STYLES.monitor.thresholdPanel)}">
        <div style="${EMAIL_STYLES.monitor.metricGrid}">
          <div>
            <p style="${EMAIL_STYLES.monitor.metricLabel}">Metric</p>
            <p style="${renderMetricValueStyle("#fff")}">${data.metricKey.toUpperCase()}</p>
          </div>
          <div>
            <p style="${EMAIL_STYLES.monitor.metricLabel}">Current Value</p>
            <p style="${renderMetricValueStyle(theme.borderColor)}">${data.value.toFixed(2)}</p>
          </div>
          <div>
            <p style="${EMAIL_STYLES.monitor.metricLabel}">Threshold</p>
            <p style="${renderMetricValueStyle("#9ca3af")}">${data.operator} ${data.threshold}</p>
          </div>
        </div>
      </div>

      <div style="${EMAIL_STYLES.monitor.panel}${EMAIL_STYLES.monitor.detailsPanel}">
        <p style="${EMAIL_STYLES.monitor.detailsLabel}">Details</p>
        <p style="${EMAIL_STYLES.monitor.detailsText}">${data.message}</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/alerts"
        style="${EMAIL_STYLES.monitor.action}">
        View Alert in Dashboard ->
      </a>

      <p style="${EMAIL_STYLES.monitor.workspaceNote}">
        You are receiving this because you are a member of the <strong style="${EMAIL_STYLES.monitor.workspaceStrong}">${data.brandName}</strong> workspace.
      </p>
      ${renderDarkFooter()}
    </div>
  `;

  await transporter.sendMail({
    from: `"VisioAd Monitor" <${process.env.EMAIL_USER}>`,
    to: data.recipients.join(", "),
    subject: `${label}: ${data.metricKey.toUpperCase()} threshold breached - ${data.brandName}`,
    html,
  });
}

export async function sendAnomalyEmail(data: AnomalyEmailData) {
  if (!data.recipients.length || !data.anomalies.length) return;

  const primary = data.anomalies[0];
  const summaryLabel = data.anomalies.length === 1 ? "1 anomaly" : `${data.anomalies.length} anomalies`;
  const highCount = data.anomalies.filter((anomaly) => anomaly.severity === "HIGH").length;

  const html = `
    <div style="${EMAIL_STYLES.monitor.shell}">
      ${renderMonitorHeader("V", EMAIL_THEMES.anomaly.logoColorStops)}
      <h1 style="${EMAIL_STYLES.monitor.title}">HIGH ANOMALY DETECTED</h1>
      <p style="${EMAIL_STYLES.monitor.intro}">
        ${summaryLabel} detected in <strong style="${EMAIL_STYLES.monitor.introStrong}">${data.brandName}</strong>
      </p>

      <div style="${renderBorderedMonitorPanel(EMAIL_THEMES.anomaly.borderColor, EMAIL_STYLES.monitor.thresholdPanel)}">
        <div style="${EMAIL_STYLES.monitor.anomalySummary}">
          <div>
            <p style="${EMAIL_STYLES.monitor.anomalyTitle}">${primary.campaign ?? "Unknown campaign"}</p>
            <p style="${EMAIL_STYLES.monitor.anomalyMeta}">${primary.platform ?? "Unknown platform"} · ${primary.metric}</p>
          </div>
          <div style="${EMAIL_STYLES.monitor.anomalyScoreWrap}">
            <p style="${EMAIL_STYLES.monitor.anomalyScoreLabel}">Highest Z-Score</p>
            <p style="${EMAIL_STYLES.monitor.anomalyScore}">${primary.z_score.toFixed(2)}</p>
          </div>
        </div>

        <div style="${EMAIL_STYLES.monitor.summaryGrid}">
          <div style="${EMAIL_STYLES.monitor.summaryItem}">
            <p style="${EMAIL_STYLES.monitor.summaryLabel}">Metric</p>
            <p style="${EMAIL_STYLES.monitor.summaryValue}">${primary.metric.toUpperCase()}</p>
          </div>
          <div style="${EMAIL_STYLES.monitor.summaryItem}">
            <p style="${EMAIL_STYLES.monitor.summaryLabel}">Value</p>
            <p style="${EMAIL_STYLES.monitor.summaryValue}">${primary.value.toFixed(2)}</p>
          </div>
          <div style="${EMAIL_STYLES.monitor.summaryItem}">
            <p style="${EMAIL_STYLES.monitor.summaryLabel}">High Severity</p>
            <p style="${EMAIL_STYLES.monitor.summaryValue}">${highCount}</p>
          </div>
        </div>

        <div style="${EMAIL_STYLES.monitor.anomalyList}">
          ${data.anomalies.slice(0, 5).map((anomaly) => `
            <div style="${EMAIL_STYLES.monitor.anomalyItem}">
              <div style="${EMAIL_STYLES.monitor.anomalyItemRow}">
                <div>
                  <p style="${EMAIL_STYLES.monitor.anomalyItemTitle}">${anomaly.campaign ?? "Unknown campaign"}</p>
                  <p style="${EMAIL_STYLES.monitor.anomalyItemMeta}">${anomaly.platform ?? "Unknown platform"} · ${anomaly.metric}</p>
                </div>
                <div style="${EMAIL_STYLES.monitor.anomalyScoreWrap}">
                  <p style="${EMAIL_STYLES.monitor.anomalyItemSeverity}">${anomaly.severity}</p>
                  <p style="${EMAIL_STYLES.monitor.anomalyItemValue}">z=${anomaly.z_score.toFixed(2)} · ${anomaly.value.toFixed(2)}</p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/anomalies"
        style="${EMAIL_STYLES.monitor.action}">
        Investigate Anomaly ->
      </a>

      <p style="${EMAIL_STYLES.monitor.workspaceNote}">
        You are receiving this because you are a member of the <strong style="${EMAIL_STYLES.monitor.workspaceStrong}">${data.brandName}</strong> workspace.
      </p>
      ${renderDarkFooter()}
    </div>
  `;

  await transporter.sendMail({
    from: `"VisioAd Monitor" <${process.env.EMAIL_USER}>`,
    to: data.recipients.join(", "),
    subject: `Anomaly Detected: ${primary.metric} in ${primary.campaign ?? "Unknown campaign"} - ${data.brandName}`,
    html,
  });
}

export async function sendApprovalEmail({
  recipientEmail,
  recipientName,
  loginUrl,
}: {
  recipientEmail: string;
  recipientName: string;
  loginUrl: string;
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${EMAIL_STYLES.approval.body}">
      <div style="${EMAIL_STYLES.approval.shell}">

        <div style="${EMAIL_STYLES.approval.hero}">
          ${renderLogoMark({
            letter: "V",
            background: EMAIL_STYLES.approval.logoBackground,
            extraStyle: EMAIL_STYLES.approval.logoShadow,
          })}
          <h1 style="${EMAIL_STYLES.approval.heroTitle}">Account Approved!</h1>
          <p style="${EMAIL_STYLES.approval.heroSubtitle}">VisioAd Ads Monitor</p>
        </div>

        <div style="${EMAIL_STYLES.approval.content}">
          <p style="${EMAIL_STYLES.approval.greeting}">Hello ${recipientName},</p>
          <p style="${EMAIL_STYLES.approval.bodyText}">
            Great news! Your VisioAd account has been reviewed and <strong style="${EMAIL_STYLES.approval.approvedStrong}">approved</strong> by an administrator.
            You can now log in and access the platform.
          </p>

          <div style="${EMAIL_STYLES.approval.statusBox}">
            <div style="${EMAIL_STYLES.approval.statusDot}"></div>
            <span style="${EMAIL_STYLES.approval.statusText}">Your account is now active and ready to use</span>
          </div>

          <div style="${EMAIL_STYLES.approval.actionWrap}">
            <a href="${loginUrl}" style="${EMAIL_STYLES.approval.action}">
              Log In to VisioAd ->
            </a>
          </div>

          <div style="${EMAIL_STYLES.approval.accessBox}">
            <p style="${EMAIL_STYLES.approval.accessTitle}">What you can access</p>
            ${[
              "Performance dashboards for your assigned brands",
              "Upload and manage Google Ads & Meta Ads CSV data",
              "View alerts and anomaly detection results",
              "Monitor campaign metrics in real time",
            ].map((item) => renderAccessItem(item)).join("")}
          </div>

          <p style="${EMAIL_STYLES.approval.note}">
            If you did not create an account on VisioAd, please ignore this email.
          </p>
        </div>

        <div style="${EMAIL_STYLES.approval.footer}">
          <p style="${EMAIL_STYLES.approval.footerText}">&copy; 2026 VisioAd &middot; Full-Service Brand Advertising Agency</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"VisioAd" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "✅ Your VisioAd account has been approved",
    html,
  });
}
