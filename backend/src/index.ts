import http from "http";
import { config } from "./config/env.config";
import app from "./server";
import allRoutes from "./routes";
import { db } from "./config/db.config";
import { startCleanupScheduler } from "./utils/tokenCleanup";
import { startNotificationScheduler } from "./utils/notificationScheduler";
import { startFeeReminderJob } from "./jobs/feeReminder";
import logger from "./utils/logger";
import { log } from "./utils/logtail";

app.use("/api", allRoutes);

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
