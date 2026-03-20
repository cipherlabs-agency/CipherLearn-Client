import { prisma } from "../config/db.config";
import logger from "./logger";
import { log } from "./logtail";

/**
 * Clean up expired password reset tokens
 */
export const cleanupExpiredPasswordResetTokens = async (): Promise<void> => {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired/used password reset tokens`);
    }
  } catch (error) {
    log("error", "info.info failed", { err: error instanceof Error ? error.message : String(error) });
    logger.error("Error cleaning up password reset tokens:", error);
  }
};

/**
 * Clean up expired blacklisted tokens
 */
export const cleanupExpiredBlacklistedTokens = async (): Promise<void> => {
  try {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired blacklisted tokens`);
    }
  } catch (error) {
    log("error", "info.info failed", { err: error instanceof Error ? error.message : String(error) });
    logger.error("Error cleaning up blacklisted tokens:", error);
  }
};

/**
 * Clean up old login attempts (older than 30 days)
 */
export const cleanupOldLoginAttempts = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} old login attempts`);
    }
  } catch (error) {
    log("error", "info.info failed", { err: error instanceof Error ? error.message : String(error) });
    logger.error("Error cleaning up login attempts:", error);
  }
};

/**
 * Run all cleanup tasks
 */
export const runTokenCleanup = async (): Promise<void> => {
  logger.info("Starting token cleanup...");
  await Promise.all([
    cleanupExpiredPasswordResetTokens(),
    cleanupExpiredBlacklistedTokens(),
    cleanupOldLoginAttempts(),
  ]);
  logger.info("Token cleanup completed");
};

/**
 * Start the cleanup scheduler (runs every hour)
 */
export const startCleanupScheduler = (): NodeJS.Timeout => {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  // Run immediately on startup
  runTokenCleanup();

  // Schedule recurring cleanup
  return setInterval(runTokenCleanup, CLEANUP_INTERVAL);
};
