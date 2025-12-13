import dotenv from "dotenv";

dotenv.config();

export const config = {
  APP: {
    PORT: process.env.APP_PORT || 3000,
    HOST: process.env.APP_HOST || "localhost",
    ENV: process.env.NODE_ENV || "development",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
    SALT: Number(process.env.SALT),
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
  NODE_MAILER: {
    HOST: process.env.NODE_MAILER_HOST || "smtp.example.com",
    PORT: Number(process.env.NODE_MAILER_PORT) || 587,
    USER: process.env.NODE_MAILER_USER || "",
    PASSWORD: process.env.NODE_MAILER_PASSWORD || "",
  },
} as const;
