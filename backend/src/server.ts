import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import httpLogger from "./middleware/httpLogger";
import logger from "./utils/logger";
import { config } from "./config/env.config";

const app = express();

// Security headers
app.use(helmet());

// Gzip/Brotli compression for all responses
app.use(compression());

// CORS — allow main client, portal, and subdomains
const allowedOrigins = [
  config.APP.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests without origin (mobile apps, Postman, server-to-server)
      if (!origin) return cb(null, true);

      // Allow exact matches
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Allow any *.cipherlearn.com subdomain
      if (/^https?:\/\/[^.]+\.cipherlearn\.com(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }

      // Allow localhost on any port (development)
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }

      cb(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Slug"],
  })
);

// Trust proxy for rate limiting (important for production behind load balancer)
app.set("trust proxy", 1);

// Body size limits — 10 MB for JSON, 50 MB for file upload form data
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(httpLogger);

app.get("/", (req, res) => {
  logger.info("Health check endpoint hit");
  return res.json({ status: "ok", service: config.CLASS.NAME });
});

export default app;
