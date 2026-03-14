import { config } from "./config/env.config";
import app from "./server";
import allRoutes from "./routes";
import { db } from "./config/db.config";
import { startCleanupScheduler } from "./utils/tokenCleanup";
import { startNotificationScheduler } from "./utils/notificationScheduler";
import logger from "./utils/logger";

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
    app.listen(config.APP.PORT, () => {
      logger.info(`Server is running on port ${config.APP.PORT}`);
      db.connect();

      // Start token cleanup scheduler (runs every hour)
      startCleanupScheduler();
      logger.info("Token cleanup scheduler started");

      // Start notification scheduler (classStartingSoon — runs every 5 min)
      startNotificationScheduler();
      logger.info("Notification scheduler started");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
