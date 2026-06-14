import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import httpLogger from "./middleware/httpLogger";
import logger from "./utils/logger";
import { config } from "./config/env.config";
import { prisma } from "./config/db.config";

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
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https?:\/\/[^.]+\.cipherlearn\.com(:\d+)?$/.test(origin)) return cb(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
      cb(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-Slug"],
  })
);

// Trust proxy for rate limiting behind load balancer
app.set("trust proxy", 1);

// Body limits — 256kb for JSON (safe API ceiling); 50mb for file upload form data
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(httpLogger);

// Global 30s request timeout — prevents hung connections from blocking the pool
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(30_000, () => {
    if (!res.headersSent) {
      logger.warn(`[Timeout] ${req.method} ${req.originalUrl} exceeded 30s`);
      res.status(503).json({ success: false, message: "Request timeout" });
    }
  });
  next();
});

// Health check with DB liveness — used by Render health checks and uptime monitors
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok", db: "ok", service: config.CLASS.NAME, uptime: Math.floor(process.uptime()) });
  } catch {
    return res.status(503).json({ status: "error", db: "down", uptime: Math.floor(process.uptime()) });
  }
});

app.get("/", (_req: Request, res: Response) => {
  return res.json({ status: "ok", service: config.CLASS.NAME });
});

export default app;
