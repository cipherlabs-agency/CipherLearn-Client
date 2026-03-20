import { Resend } from "resend";
import { config } from "../config/env.config";
import logger from "./logger";
import { log } from "./logtail";

// ── Lazy singleton — instantiated once per process ──────────────────────────

let _resend: Resend | null = null;

function getClient(): Resend {
  if (!_resend) _resend = new Resend(config.RESEND.API_KEY);
  return _resend;
}

function from(): string {
  return `"${config.RESEND.FROM_NAME}" <${config.RESEND.FROM_EMAIL}>`;
}

// ── Base sender ──────────────────────────────────────────────────────────────

interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  if (!config.RESEND.API_KEY) {
    logger.warn(`[email] RESEND_API_KEY not set — skipping email to ${opts.to}`);
    return false;
  }
  try {
    const { error } = await getClient().emails.send({
      from:    from(),
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
    });
    if (error) throw error;
    logger.info(`[email] Sent "${opts.subject}" → ${opts.to}`);
    return true;
  } catch (err) {
    log("error", "info.info failed", { err: err instanceof Error ? err.message : String(err) });
    logger.error(`[email] Failed to send to ${opts.to}:`, err);
    return false;
  }
}

// ── Shared template helpers ──────────────────────────────────────────────────

function headerBlock(title: string): string {
  const primary = config.CLASS.PRIMARY_COLOR;
  const accent  = config.CLASS.ACCENT_COLOR;
  const name    = config.CLASS.NAME;
  return `
    <div style="background:linear-gradient(135deg,${primary} 0%,${accent} 100%);padding:30px;text-align:center;border-radius:10px 10px 0 0">
      <h1 style="color:#fff;margin:0;font-size:28px">${name}</h1>
      <p style="color:rgba(255,255,255,.9);margin:10px 0 0">${title}</p>
    </div>`;
}

function bodyWrap(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f9fafb;padding:30px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none">
        ${inner}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0">
        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">
          This is an automated message from ${config.CLASS.NAME}. Please do not reply.
        </p>
      </div>
    </body></html>`;
}

function warningBox(html: string): string {
  return `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:0 5px 5px 0">${html}</div>`;
}

function successBox(html: string): string {
  return `<div style="background:#ecfdf5;border-left:4px solid #10b981;padding:15px;margin:20px 0;border-radius:0 5px 5px 0">${html}</div>`;
}

// ── Password reset OTP (student / teacher app) ───────────────────────────────

export async function sendPasswordResetEmail(
  email:       string,
  otp:         string,
  studentName: string
): Promise<boolean> {
  const primary     = config.CLASS.PRIMARY_COLOR;
  const className   = config.CLASS.NAME;
  const expiryMins  = config.OTP.EXPIRY_MINUTES;

  const body = bodyWrap(`
    <p style="font-size:16px">Hello <strong>${studentName}</strong>,</p>
    <p style="font-size:16px">We received a request to reset your password. Use the OTP below:</p>
    <div style="background:#fff;border:2px solid ${primary};border-radius:10px;padding:25px;text-align:center;margin:25px 0">
      <p style="margin:0 0 10px;color:#6b7280;font-size:14px">Your One-Time Password</p>
      <h2 style="margin:0;font-size:36px;letter-spacing:8px;color:${primary};font-family:monospace">${otp}</h2>
    </div>
    ${warningBox(`<p style="margin:0;color:#92400e;font-size:14px"><strong>Important:</strong> This OTP expires in <strong>${expiryMins} minutes</strong>. Do not share it.</p>`)}
    <p style="font-size:14px;color:#6b7280">If you didn't request this, please ignore this email.</p>
  `);

  return sendEmail({
    to:      email,
    subject: `Password Reset OTP — ${className}`,
    html:    `${headerBlock("Password Reset Request")}${body}`,
  });
}

// ── Account registration (new student / teacher) ─────────────────────────────

export async function sendAccountRegistrationEmail(
  email: string,
  name:  string,
  role:  "STUDENT" | "TEACHER"
): Promise<boolean> {
  const roleLabel = role === "TEACHER" ? "Teacher" : "Student";
  const className = config.CLASS.NAME;

  const body = bodyWrap(`
    <p style="font-size:16px">Hello <strong>${name}</strong>,</p>
    <p style="font-size:16px">Your <strong>${roleLabel}</strong> account on ${className} has been created.</p>
    ${successBox(`
      <p style="margin:0;color:#065f46;font-size:14px"><strong>Next Steps:</strong></p>
      <ol style="margin:10px 0 0;padding-left:20px;color:#065f46;font-size:14px">
        <li>Open the ${className} app</li>
        <li>Enter your registered email: <strong>${email}</strong></li>
        <li>Set up your password when prompted</li>
        <li>Log in and access your ${roleLabel.toLowerCase()} dashboard</li>
      </ol>
    `)}
    ${warningBox(`<p style="margin:0;color:#92400e;font-size:14px"><strong>Keep this email safe.</strong> Your login email is <strong>${email}</strong>.</p>`)}
    <p style="font-size:14px;color:#6b7280">Questions? Contact your class administrator.</p>
  `);

  return sendEmail({
    to:      email,
    subject: `Your ${className} ${roleLabel} Account is Ready`,
    html:    `${headerBlock(`${roleLabel} Account Created`)}${body}`,
  });
}

// ── Admin / teacher dashboard password reset ─────────────────────────────────

export async function sendAdminPasswordResetEmail(
  email:      string,
  name:       string,
  resetToken: string
): Promise<boolean> {
  const primary   = config.CLASS.PRIMARY_COLOR;
  const className = config.CLASS.NAME;
  const resetUrl  = config.APP.CLIENT_URL
    ? `${config.APP.CLIENT_URL}/reset-password?token=${resetToken}`
    : null;

  const resetSection = resetUrl
    ? `
      <div style="text-align:center;margin:30px 0">
        <a href="${resetUrl}" style="background:${primary};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block">
          Reset My Password
        </a>
      </div>
      <p style="font-size:14px;color:#6b7280;text-align:center">
        Button not working? Copy and paste:<br>
        <a href="${resetUrl}" style="color:${primary};word-break:break-all">${resetUrl}</a>
      </p>`
    : `
      <p style="font-size:14px;color:#6b7280">Use the token below with the reset-password endpoint:</p>
      <div style="background:#fff;border:2px solid ${primary};border-radius:10px;padding:20px;margin:25px 0;word-break:break-all">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Reset Token</p>
        <code style="font-size:13px;color:${primary};font-family:monospace">${resetToken}</code>
      </div>`;

  const body = bodyWrap(`
    <p style="font-size:16px">Hello <strong>${name}</strong>,</p>
    <p style="font-size:16px">We received a request to reset your admin account password.</p>
    ${resetSection}
    ${warningBox(`<p style="margin:0;color:#92400e;font-size:14px"><strong>Important:</strong> This link expires in 1 hour. Do not share it.</p>`)}
    <p style="font-size:14px;color:#6b7280">Didn't request this? Your account remains secure — ignore this email.</p>
  `);

  return sendEmail({
    to:      email,
    subject: `Admin Password Reset — ${className}`,
    html:    `${headerBlock("Password Reset Request")}${body}`,
  });
}

// ── Welcome email (after first password setup) ───────────────────────────────

export async function sendWelcomeEmail(
  email:       string,
  studentName: string
): Promise<boolean> {
  const className = config.CLASS.NAME;

  const body = bodyWrap(`
    <p style="font-size:16px">Hello <strong>${studentName}</strong>,</p>
    <p style="font-size:16px">Your account is set up. You can now log in to the ${className} app.</p>
    ${successBox(`
      <p style="margin:0;color:#065f46;font-size:14px"><strong>What you can do:</strong></p>
      <ul style="margin:10px 0 0;padding-left:20px;color:#065f46;font-size:14px">
        <li>View attendance records</li>
        <li>Access study materials</li>
        <li>Submit assignments</li>
        <li>Check announcements</li>
        <li>View fee receipts</li>
      </ul>
    `)}
    <p style="font-size:14px;color:#6b7280">Questions? Reach out to your instructor.</p>
  `);

  return sendEmail({
    to:      email,
    subject: `Welcome to ${className} — Account Setup Complete`,
    html:    `${headerBlock("Welcome Aboard!")}${body}`,
  });
}
