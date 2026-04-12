import nodemailer from "nodemailer";

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
  <p style="color:#4b5563;font-size:11px;text-align:center;margin:0;">&copy; 2026 VisioAd · Full-Service Brand Advertising Agency</p>
`;

export async function sendAlertEmail(data: AlertEmailData) {
  if (!data.recipients.length) return;

  const isCritical = data.severity === "CRITICAL";
  const color = isCritical ? "#dc2626,#f87171" : "#d97706,#fbbf24";
  const label = isCritical ? "CRITICAL ALERT" : "WARNING ALERT";
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
        View Alert in Dashboard ->
      </a>

      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        You are receiving this because you are a member of the <strong style="color:#9ca3af;">${data.brandName}</strong> workspace.
      </p>
      ${FOOTER}
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
    <div style="${BASE_STYLE}">
      ${HEADER("V", "#f85149,#fca5a5")}
      <h1 style="font-size:20px;font-weight:700;margin:0 0 6px;color:#fff;text-align:center;">HIGH ANOMALY DETECTED</h1>
      <p style="color:#9ca3af;font-size:14px;text-align:center;margin:0 0 24px;">
        ${summaryLabel} detected in <strong style="color:#fff;">${data.brandName}</strong>
      </p>

      <div style="background:#111827;border:1px solid #1f2937;border-left:4px solid #f85149;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <p style="font-size:16px;font-weight:700;color:#fff;margin:0 0 4px;">${primary.campaign ?? "Unknown campaign"}</p>
            <p style="font-size:12px;color:#6b7280;margin:0;">${primary.platform ?? "Unknown platform"} · ${primary.metric}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin:0 0 2px;">Highest Z-Score</p>
            <p style="font-size:28px;font-weight:800;color:#f85149;margin:0;">${primary.z_score.toFixed(2)}</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
          <div style="background:#0d0f12;border-radius:8px;padding:12px;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Metric</p>
            <p style="font-size:13px;font-weight:600;color:#d1d5db;margin:0;">${primary.metric.toUpperCase()}</p>
          </div>
          <div style="background:#0d0f12;border-radius:8px;padding:12px;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">Value</p>
            <p style="font-size:13px;font-weight:600;color:#d1d5db;margin:0;">${primary.value.toFixed(2)}</p>
          </div>
          <div style="background:#0d0f12;border-radius:8px;padding:12px;">
            <p style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;">High Severity</p>
            <p style="font-size:13px;font-weight:600;color:#d1d5db;margin:0;">${highCount}</p>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          ${data.anomalies.slice(0, 5).map((anomaly) => `
            <div style="background:#0d0f12;border-radius:8px;padding:12px;">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
                <div>
                  <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">${anomaly.campaign ?? "Unknown campaign"}</p>
                  <p style="font-size:12px;color:#9ca3af;margin:0;">${anomaly.platform ?? "Unknown platform"} · ${anomaly.metric}</p>
                </div>
                <div style="text-align:right;">
                  <p style="font-size:12px;font-weight:700;color:#fca5a5;margin:0;">${anomaly.severity}</p>
                  <p style="font-size:12px;color:#d1d5db;margin:4px 0 0;">z=${anomaly.z_score.toFixed(2)} · ${anomaly.value.toFixed(2)}</p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/anomalies"
        style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#5865f2,#818cf8);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;">
        Investigate Anomaly ->
      </a>

      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        You are receiving this because you are a member of the <strong style="color:#9ca3af;">${data.brandName}</strong> workspace.
      </p>
      ${FOOTER}
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
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

        <div style="background:linear-gradient(135deg,#5865f2,#818cf8);padding:32px 40px;text-align:center;">
          <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
            <span style="color:white;font-weight:800;font-size:20px;">V</span>
          </div>
          <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Account Approved!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">VisioAd Ads Monitor</p>
        </div>

        <div style="padding:40px;">
          <p style="font-size:16px;color:#111827;margin:0 0 8px;font-weight:600;">Hello ${recipientName},</p>
          <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px;">
            Great news! Your VisioAd account has been reviewed and <strong style="color:#16a34a;">approved</strong> by an administrator.
            You can now log in and access the platform.
          </p>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:10px;">
            <div style="width:10px;height:10px;background:#16a34a;border-radius:50%;flex-shrink:0;"></div>
            <span style="font-size:13px;color:#15803d;font-weight:600;">Your account is now active and ready to use</span>
          </div>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="${loginUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#5865f2,#818cf8);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.01em;">
              Log In to VisioAd ->
            </a>
          </div>

          <div style="background:#f8fafc;border-radius:10px;padding:18px;margin-bottom:24px;">
            <p style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">What you can access</p>
            ${[
              "Performance dashboards for your assigned brands",
              "Upload and manage Google Ads & Meta Ads CSV data",
              "View alerts and anomaly detection results",
              "Monitor campaign metrics in real time",
            ].map(item => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="width:6px;height:6px;background:#5865f2;border-radius:50%;flex-shrink:0;"></div>
                <span style="font-size:13px;color:#374151;">${item}</span>
              </div>
            `).join("")}
          </div>

          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
            If you did not create an account on VisioAd, please ignore this email.
          </p>
        </div>

        <div style="border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="font-size:12px;color:#9ca3af;margin:0;">© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
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
