import http from "http";
import type { Request, Response, NextFunction } from "express";
import { config } from "./config/env.config";
import app from "./server";
import allRoutes from "./routes";
import { db } from "./config/db.config";
import { startCleanupScheduler } from "./utils/tokenCleanup";
import { startNotificationScheduler } from "./utils/notificationScheduler";
import { startFeeReminderJob } from "./jobs/feeReminder";
import logger from "./utils/logger";
import { log } from "./utils/logtail";
import { sseManager } from "./sse/manager";

app.use("/api", allRoutes);

// ── Global error handler (MUST be registered after the routes) ────────────────
// Errors thrown in middleware — most commonly Multer file-upload rejections
// (LIMIT_UNEXPECTED_FILE, LIMIT_FILE_SIZE) or its file-type guard — otherwise
// escape to Express's default handler, which returns an HTML "Internal Server
// Error" page that mobile clients cannot parse. Always respond with JSON so the
// real reason reaches the app.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  const isMulterError = err?.name === "MulterError";
  const isFileTypeError = typeof err?.message === "string" && err.message.includes("is not allowed");

  if (isMulterError || isFileTypeError) {
    const codeMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: "One of the files is too large.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
      LIMIT_UNEXPECTED_FILE: `Unexpected file field "${err?.field ?? ""}". Check the upload field name.`,
      LIMIT_PART_COUNT: "Too many form parts.",
    };
    const message = codeMessages[err?.code as string] || err?.message || "File upload error.";
    logger.error("Upload/middleware error:", err);
    log("error", "app.upload.error", { err: err?.message, code: err?.code, field: err?.field });
    return res.status(400).json({ success: false, message });
  }

  logger.error("Unhandled application error:", err);
  log("error", "app.unhandled.error", { err: err instanceof Error ? err.message : String(err) });
  return res.status(err?.status || err?.statusCode || 500).json({
    success: false,
    message: err?.message || "Internal Server Error",
  });
});

// ── Startup security / config checks ─────────────────────────────────────────
if (config.JWT.SECRET === "your_jwt_secret") {
  logger.warn("SECURITY WARNING: JWT_SECRET is using the insecure default. Set a strong secret in production.");
}
if (config.APP.ENV === "production" && !config.RESEND.API_KEY) {
  logger.warn("CONFIG WARNING: RESEND_API_KEY is not set — email delivery will fail.");
}
if (config.APP.ENV === "production" && !config.RESEND.FROM_EMAIL) {
  logger.warn("CONFIG WARNING: RESEND_FROM_EMAIL is not set — email delivery will fail.");
}
if (config.APP.ENV === "production" && !config.APP.CLIENT_URL) {
  logger.warn("CONFIG WARNING: CLIENT_URL is not set — CORS will block all frontend requests.");
}
// ─────────────────────────────────────────────────────────────────────────────

async function startServer() {
  try {
    const server = http.createServer(app);

    server.listen(config.APP.PORT, () => {
      logger.info(`Server is running on port ${config.APP.PORT}`);
      log("warn", "Instance started", { timestamp: new Date().toISOString() });
      void db.connect();

      startCleanupScheduler();
      logger.info("Token cleanup scheduler started");

      startNotificationScheduler();
      logger.info("Notification scheduler started");

      startFeeReminderJob();

      sseManager.startHeartbeat();
      logger.info("SSE heartbeat started (25s interval)");
    });

    // Graceful shutdown — drain in-flight requests before Node exits.
    // Render sends SIGTERM before killing the container; without this handler,
    // active requests are cut mid-flight.
    const shutdown = (signal: string) => {
      logger.info(`[Shutdown] ${signal} received — draining in-flight requests`);
      server.close(async () => {
        await db.disconnect();
        log("warn", "Instance stopped gracefully", { timestamp: new Date().toISOString() });
        logger.info("[Shutdown] All connections drained. Exiting.");
        process.exit(0);
      });
      // Force-exit if drain stalls (e.g. a long-running WebSocket or keep-alive)
      setTimeout(() => {
        logger.error("[Shutdown] Forced exit — drain did not complete within 10s");
        process.exit(1);
      }, 10_000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT",  () => shutdown("SIGINT"));

  } catch (error) {
    logger.error("Failed to start server:", error);
    log("error", "Failed to start server", { err: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

startServer();
