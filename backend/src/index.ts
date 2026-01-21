import { config } from "./config/env.config";
import app from "./server";
import allRoutes from "./routes";
import Database from "./config/db.config";
import { startCleanupScheduler } from "./utils/tokenCleanup";
import logger from "./utils/logger";

app.use("/api", allRoutes);

const db = new Database();

async function startServer() {
  try {
    app.listen(config.APP.PORT, () => {
      logger.info(`Server is running on port ${config.APP.PORT}`);
      db.connect();

      // Start token cleanup scheduler (runs every hour)
      startCleanupScheduler();
      logger.info("Token cleanup scheduler started");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
