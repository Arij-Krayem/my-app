import nodemailer from "nodemailer";
import { EMAIL_STYLES, EMAIL_THEMES, renderDarkFooter, renderLogoMark } from "./email-template";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"Visioad" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Visioad password",
    html: `
      <div style="${EMAIL_STYLES.passwordReset.shell}">
        <div style="${EMAIL_STYLES.passwordReset.header}">
          ${renderLogoMark({ letter: "V", background: EMAIL_THEMES.brandLogoGradient })}
          <h1 style="${EMAIL_STYLES.passwordReset.title}">Reset your password</h1>
          <p style="${EMAIL_STYLES.passwordReset.subtitle}">You requested a password reset for your Visioad account.</p>
        </div>

        <a href="${resetUrl}" style="${EMAIL_STYLES.passwordReset.action}">
          Reset Password &rarr;
        </a>

        <p style="${EMAIL_STYLES.passwordReset.note}">
          This link expires in <strong style="${EMAIL_STYLES.passwordReset.noteStrong}">1 hour</strong>. If you didn't request this, ignore this email.
        </p>

        ${renderDarkFooter()}
      </div>
    `,
  });
}
