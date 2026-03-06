import nodemailer from "nodemailer";
import { config } from "../config/env.config";
import logger from "./logger";

const transporter = nodemailer.createTransport({
  host: config.NODE_MAILER.HOST,
  port: config.NODE_MAILER.PORT,
  secure: config.NODE_MAILER.PORT === 465,
  auth: {
    user: config.NODE_MAILER.USER,
    pass: config.NODE_MAILER.PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using nodemailer
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"${config.NODE_MAILER.FROM_NAME}" <${config.NODE_MAILER.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
};

/**
 * Send password reset OTP email
 */
export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  studentName: string
): Promise<boolean> => {
  const expiryMinutes = config.OTP.EXPIRY_MINUTES;
  const className = config.CLASS.NAME;
  const primaryColor = config.CLASS.PRIMARY_COLOR;
  const accentColor = config.CLASS.ACCENT_COLOR;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${className}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>

        <p style="font-size: 16px;">We received a request to reset your password. Use the OTP below to proceed:</p>

        <div style="background: white; border: 2px solid ${primaryColor}; border-radius: 10px; padding: 25px; text-align: center; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your One-Time Password</p>
          <h2 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: ${primaryColor}; font-family: monospace;">${otp}</h2>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> This OTP will expire in <strong>${expiryMinutes} minutes</strong>.
            Do not share this code with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          If you didn't request this password reset, please ignore this email or contact support if you have concerns.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          This is an automated message from ${className}. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Password Reset OTP - ${className}`,
    html,
  });
};

/**
 * Send account registration email to newly created students/teachers
 * Called right after enrollment/teacher creation — notifies them to set up their password
 */
export const sendAccountRegistrationEmail = async (
  email: string,
  name: string,
  role: "STUDENT" | "TEACHER"
): Promise<boolean> => {
  const roleLabel = role === "TEACHER" ? "Teacher" : "Student";
  const className = config.CLASS.NAME;
  const primaryColor = config.CLASS.PRIMARY_COLOR;
  const accentColor = config.CLASS.ACCENT_COLOR;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your ${className} Account is Ready</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${className}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${roleLabel} Account Created</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>

        <p style="font-size: 16px;">
          Your <strong>${roleLabel}</strong> account has been created on ${className}.
          You're almost ready to get started — you just need to set up your password.
        </p>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">
            <strong>Next Steps:</strong>
          </p>
          <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #065f46; font-size: 14px;">
            <li>Open the ${className} app</li>
            <li>Enter your registered email: <strong>${email}</strong></li>
            <li>Set up your password when prompted</li>
            <li>Log in and access your ${roleLabel.toLowerCase()} dashboard</li>
          </ol>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> Keep this email safe — your registered email address is
            <strong>${email}</strong>. You will need it to log in.
          </p>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          If you have any questions, please contact your class administrator.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          This is an automated message from ${className}. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${className} ${roleLabel} Account is Ready`,
    html,
  });
};

/**
 * Send password reset email to admin/teacher (dashboard)
 * Includes a clickable reset link; raw token included as fallback
 */
export const sendAdminPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  const className = config.CLASS.NAME;
  const primaryColor = config.CLASS.PRIMARY_COLOR;
  const accentColor = config.CLASS.ACCENT_COLOR;
  const resetUrl = config.APP.CLIENT_URL
    ? `${config.APP.CLIENT_URL}/reset-password?token=${resetToken}`
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${className}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>

        <p style="font-size: 16px;">We received a request to reset your admin account password.</p>

        ${resetUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: ${primaryColor}; color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
            Reset My Password
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Button not working? Copy and paste this link into your browser:
          <br><a href="${resetUrl}" style="color: ${primaryColor}; word-break: break-all;">${resetUrl}</a>
        </p>
        ` : `
        <p style="font-size: 14px; color: #6b7280;">Use the token below with the reset password endpoint:</p>

        <div style="background: white; border: 2px solid ${primaryColor}; border-radius: 10px; padding: 20px; margin: 25px 0; word-break: break-all;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Reset Token</p>
          <code style="font-size: 13px; color: ${primaryColor}; font-family: monospace;">${resetToken}</code>
        </div>
        `}

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> This link expires in 1 hour. Do not share it with anyone.
          </p>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          If you did not request a password reset, please ignore this email. Your account remains secure.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          This is an automated message from ${className}. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Admin Password Reset — ${className}`,
    html,
  });
};

/**
 * Send welcome email after password setup
 */
export const sendWelcomeEmail = async (
  email: string,
  studentName: string
): Promise<boolean> => {
  const className = config.CLASS.NAME;
  const primaryColor = config.CLASS.PRIMARY_COLOR;
  const accentColor = config.CLASS.ACCENT_COLOR;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${className}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${className}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Welcome Aboard!</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>

        <p style="font-size: 16px;">Your account has been successfully set up. You can now log in to the ${className} Student App using your email and password.</p>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">
            <strong>What you can do:</strong>
          </p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #065f46; font-size: 14px;">
            <li>View your attendance records</li>
            <li>Access study materials</li>
            <li>Submit assignments</li>
            <li>Check announcements</li>
            <li>View fee receipts</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          If you have any questions or need assistance, please reach out to your instructor.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          This is an automated message from ${className}. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${className} - Account Setup Complete`,
    html,
  });
};
