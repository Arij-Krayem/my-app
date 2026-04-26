import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const LOGO_MARK = `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="border-collapse:collapse;margin:0 auto 14px;">
    <tr>
      <td width="48" height="48" align="center" valign="middle" style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#6c63ff,#818cf8);">
        <span style="display:block;width:48px;height:48px;line-height:48px;text-align:center;color:#ffffff;font-size:22px;font-weight:800;font-family:'Segoe UI',Arial,sans-serif;mso-line-height-rule:exactly;">V</span>
      </td>
    </tr>
  </table>
`;

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"Visioad" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Visioad password",
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0f12;border-radius:16px;color:#fff;">
        <div style="text-align:center;margin-bottom:28px;">
          ${LOGO_MARK}
          <h1 style="font-size:22px;font-weight:700;margin:0;color:#fff;">Reset your password</h1>
          <p style="color:#9ca3af;font-size:14px;margin-top:6px;">You requested a password reset for your Visioad account.</p>
        </div>

        <a href="${resetUrl}" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#6c63ff,#818cf8);color:#fff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:20px;">
          Reset Password →
        </a>

        <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
          This link expires in <strong style="color:#9ca3af;">1 hour</strong>. If you didn't request this, ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;" />
        <p style="color:#4b5563;font-size:11px;text-align:center;margin:0;">© 2026 VisioAd · Full-Service Brand Advertising Agency</p>
      </div>
    `,
  });
}
