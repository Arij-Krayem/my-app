import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface AlertEmailData {
  brandName:  string;
  metricKey:  string;
  value:      number;
  operator:   string;
  threshold:  number;
  severity:   "WARNING" | "CRITICAL";
  message:    string;
  recipients: string[];
}

interface AnomalyEmailData {
  brandName:      string;
  campaign:       string;
  metric:         string;
  score:          number;
  description:    string;
  dateRange:      string;
  platform:       string;
  recommendation: string;
  recipients:     string[];
}

const BASE_STYLE = `
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 32px;
  background: #0d0f12;
  border-radius: 16px;
  color: #fff;
`;

const HEADER = (letter: string, color: string) => `
  <div style="text-align:center;margin-bottom:28px;">
    <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,${color});display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:white;margin-bottom:12px;">${letter}</div>
  </div>
`;

const FOOTER = `
  <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;" />
  <p style="color:#4b5563;font-size:11px;text-align:center;margin:0;">© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
`;

export async function sendAlertEmail(data: AlertEmailData) {
  if (!data.recipients.length) return;

  const isCritical = data.severity === "CRITICAL";
  const color      = isCritical ? "#dc2626,#f87171" : "#d97706,#fbbf24";
  const label      = isCritical ? "🚨 CRITICAL ALERT" : "⚠️ WARNING ALERT";
  const borderColor = isCritical ? "#dc2626" : "#d97706";

  const html = `
    <div style="${BASE_STYLE}">
      ${HEADER("V", color)}
      <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;text-align:center;">${label}</h1>
      <p style="color:#9ca3af;font-size:14px;text-align:center;margin:0 0 24px;">A performance threshold has been breached for <strong style="color:#fff;">${data.brandName}</strong></p>

      <div style="background:#111827;border:1px solid #1f2937;border-left:4px solid ${borderColor};border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;">
          <div>
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Metric</p>
            <p style="font-size:18px;font-weight:700;color:#fff;margin:0;">${data.metricKey.toUpperCase()}</p>
          </div>
          <div>
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Current Value</p>
            <p style="font-size:18px;font-weight:700;color:${borderColor};margin:0;">${data.value.toFixed(2)}</p>
          </div>
          <div>
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px;">Threshold</p>
            <p style="font-size:18px;font-weight:700;color:#9ca3af;margin:0;">${data.operator} ${data.threshold}</p>
          </div>
        </div>
      </div>

      <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">Details</p>
        <p style="font-size:14px;color:#d1d5db;margin:0;">${data.message}</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/alerts"
        style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#5865f2,#818cf8);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;">
        View Alert in Dashboard →
      </a>

      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        You are receiving this because you are a member of the <strong style="color:#9ca3af;">${data.brandName}</strong> workspace.
      </p>
      ${FOOTER}
    </div>
  `;

  await transporter.sendMail({
    from:    `"VisioAd Monitor" <${process.env.EMAIL_USER}>`,
    to:      data.recipients.join(", "),
    subject: `${label}: ${data.metricKey.toUpperCase()} threshold breached — ${data.brandName}`,
    html,
  });
}

export async function sendAnomalyEmail(data: AnomalyEmailData) {
  if (!data.recipients.length) return;

  const scorePercent = (data.score * 100).toFixed(0);

  const html = `
    <div style="${BASE_STYLE}">
      ${HEADER("V", "#f85149,#fca5a5")}
      <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;text-align:center;">🔍 HIGH ANOMALY DETECTED</h1>
      <p style="color:#9ca3af;font-size:14px;text-align:center;margin:0 0 24px;">
        A statistical anomaly has been detected in <strong style="color:#fff;">${data.brandName}</strong>
      </p>

      <div style="background:#111827;border:1px solid #1f2937;border-left:4px solid #f85149;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <p style="font-size:16px;font-weight:700;color:#fff;margin:0 0 4px;">${data.campaign}</p>
            <p style="font-size:12px;color:#6b7280;margin:0;">${data.platform} · ${data.metric}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 2px;">Anomaly Score</p>
            <p style="font-size:28px;font-weight:800;color:#f85149;margin:0;">${scorePercent}%</p>
          </div>
        </div>

        <div style="height:6px;border-radius:3px;background:#1f2937;overflow:hidden;margin-bottom:16px;">
          <div style="height:100%;width:${scorePercent}%;background:#f85149;border-radius:3px;"></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#0d0f12;border-radius:8px;padding:12px;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Date Range</p>
            <p style="font-size:13px;font-weight:600;color:#d1d5db;margin:0;">${data.dateRange}</p>
          </div>
          <div style="background:#0d0f12;border-radius:8px;padding:12px;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Analysis</p>
            <p style="font-size:13px;font-weight:600;color:#d1d5db;margin:0;">${data.description}</p>
          </div>
        </div>
      </div>

      <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;">💡 Recommendation</p>
        <p style="font-size:14px;color:#d1d5db;margin:0;">${data.recommendation}</p>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/anomalies"
        style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#5865f2,#818cf8);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;">
        Investigate Anomaly →
      </a>

      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        You are receiving this because you are a member of the <strong style="color:#9ca3af;">${data.brandName}</strong> workspace.
      </p>
      ${FOOTER}
    </div>
  `;

  await transporter.sendMail({
    from:    `"VisioAd Monitor" <${process.env.EMAIL_USER}>`,
    to:      data.recipients.join(", "),
    subject: `🔍 Anomaly Detected: ${data.metric} in ${data.campaign} — ${data.brandName}`,
    html,
  });
}