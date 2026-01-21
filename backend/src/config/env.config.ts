import dotenv from "dotenv";

dotenv.config();

export const config = {
  APP: {
    PORT: process.env.APP_PORT || 3000,
    HOST: process.env.APP_HOST || "localhost",
    ENV: process.env.NODE_ENV || "development",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
    SALT: Number(process.env.SALT),
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  },
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: Number(process.env.DB_PORT) || 5432,
    USER: process.env.DB_USER || "user",
    PASSWORD: process.env.DB_PASSWORD || "password",
    NAME: process.env.DB_NAME || "database",
    URL: process.env.DB_URL || "",
  },
  CLOUDINAIRY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    API_KEY: process.env.CLOUDINARY_API_KEY || "",
    API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || "your_jwt_secret",
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
    REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d",
  },
  QR: {
    // Dedicated secret for QR code token generation
    // Should be different from JWT_SECRET in production
    SECRET: process.env.QR_SECRET || process.env.JWT_SECRET || "qr_attendance_secret",
  },
  NODE_MAILER: {
    HOST: process.env.NODE_MAILER_HOST || "smtp.example.com",
    PORT: Number(process.env.NODE_MAILER_PORT) || 587,
    USER: process.env.NODE_MAILER_USER || "",
    PASSWORD: process.env.NODE_MAILER_PASSWORD || "",
    FROM_EMAIL: process.env.NODE_MAILER_FROM_EMAIL || "noreply@cipherlearn.com",
    FROM_NAME: process.env.NODE_MAILER_FROM_NAME || "CipherLearn",
  },
  RATE_LIMIT: {
    LOGIN_MAX: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
    LOGIN_WINDOW_MS: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    PASSWORD_RESET_MAX: Number(process.env.RATE_LIMIT_PASSWORD_RESET_MAX) || 3,
    PASSWORD_RESET_WINDOW_MS: Number(process.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  },
  ACCOUNT_LOCKOUT: {
    MAX_FAILED_ATTEMPTS: Number(process.env.ACCOUNT_LOCKOUT_MAX_FAILED) || 5,
    LOCKOUT_DURATION_MINUTES: Number(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES) || 30,
  },
  OTP: {
    EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES) || 10,
  },
} as const;
