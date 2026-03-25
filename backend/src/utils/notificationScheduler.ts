/**
 * Notification Scheduler
 *
 * Runs background tasks for time-sensitive push notifications.
 * - "Class Starting Soon" (10 minutes before lecture) — every 5 min
 * - Notification cleanup (old read + per-user cap) — every 6 hours
 *
 * Uses setInterval — consistent with the existing tokenCleanup scheduler.
 */

import { prisma } from "../config/db.config";
import logger from "./logger";
import { sendToBatchStudents, sendToUser } from "./pushNotifications";

// Track lectures that have already been notified to avoid duplicates.
// Cleared every 24 hours. Holds lectureIds as strings.
const notifiedLectures = new Set<number>();
let lastClearDate = new Date().toDateString();

function clearStaleNotifiedSet() {
  const today = new Date().toDateString();
  if (today !== lastClearDate) {
    notifiedLectures.clear();
    lastClearDate = today;
  }
}

/**
 * Check for lectures starting within the next 8–13 minutes and send push notifications.
 * The 5-minute window (±2.5 min around the 10-min mark) ensures the 5-min interval
 * catches each lecture exactly once.
 */
async function sendClassStartingSoonNotifications(): Promise<void> {
  clearStaleNotifiedSet();

  const now = new Date();
  const windowStart = new Date(now.getTime() + 8 * 60 * 1000);  // 8 min from now
  const windowEnd = new Date(now.getTime() + 13 * 60 * 1000);   // 13 min from now

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Get today's scheduled lectures
  const lectures = await prisma.lecture.findMany({
    where: {
      date: { gte: todayStart, lt: todayEnd },
      isDeleted: false,
      status: "SCHEDULED",
    },
    select: {
      id: true,
      title: true,
      subject: true,
      batchId: true,
      teacherId: true,
      startTime: true,
    },
  });

  for (const lecture of lectures) {
    if (notifiedLectures.has(lecture.id)) continue;

    const [h, m] = lecture.startTime.split(":").map(Number);
    const lectureMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diffMs = (lectureMinutes - nowMinutes) * 60 * 1000;

    if (diffMs < 8 * 60 * 1000 || diffMs > 13 * 60 * 1000) continue;

    notifiedLectures.add(lecture.id);

    // Notify students in the batch
    sendToBatchStudents(
      lecture.batchId,
      "classStartingSoon",
      "Class Starting Soon",
      `${lecture.subject} starts in ~10 minutes`,
      { type: "class_starting_soon", lectureId: lecture.id }
    ).catch(() => {});

    // Notify the assigned teacher
    if (lecture.teacherId) {
      sendToUser(
        lecture.teacherId,
        "Your Class Starts Soon",
        `${lecture.subject} begins in ~10 minutes`,
        { type: "class_starting_soon", lectureId: lecture.id }
      ).catch(() => {});
    }
  }
}

// ── Notification Cleanup ───────────────────────────────────────────────────────

const MAX_NOTIFICATIONS_PER_USER = 100;
const DELETE_READ_OLDER_THAN_DAYS = 30;

/**
 * Clean up old notifications to prevent database bloat.
 * 1. Delete all READ notifications older than 30 days
 * 2. For each user with >100 notifications, keep only the 100 most recent
 */
async function cleanupNotifications(): Promise<void> {
  try {
    // 1. Delete old read notifications
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DELETE_READ_OLDER_THAN_DAYS);

    const oldDeleted = await prisma.notification.deleteMany({
      where: { isRead: true, createdAt: { lt: cutoff } },
    });

    // 2. Cap per-user notifications (keep most recent MAX_NOTIFICATIONS_PER_USER)
    // Find users with more than the cap
    const overflowUsers = await prisma.$queryRaw<{ userId: number; cnt: number }[]>`
      SELECT "userId", COUNT(*)::int as cnt 
      FROM "notifications" 
      GROUP BY "userId" 
      HAVING COUNT(*) > ${MAX_NOTIFICATIONS_PER_USER}
    `;

    let cappedTotal = 0;
    for (const { userId, cnt } of overflowUsers) {
      // Find the ID of the Nth most recent notification (the cutoff point)
      const cutoffRow = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: MAX_NOTIFICATIONS_PER_USER,
        take: 1,
        select: { id: true },
      });

      if (cutoffRow.length > 0) {
        const deleted = await prisma.notification.deleteMany({
          where: {
            userId,
            id: { lte: cutoffRow[0].id },
          },
        });
        cappedTotal += deleted.count;
      }
    }

    if (oldDeleted.count > 0 || cappedTotal > 0) {
      logger.info(
        `[Notification Cleanup] Deleted ${oldDeleted.count} old read, ${cappedTotal} over-cap. ${overflowUsers.length} users were over ${MAX_NOTIFICATIONS_PER_USER} limit.`
      );
    }
  } catch (error) {
    logger.error("[Notification Cleanup] Failed:", error);
  }
}

/**
 * Start the notification scheduler.
 * - Class-starting-soon check: every 5 min
 * - Notification cleanup: every 6 hours
 */
export function startNotificationScheduler(): NodeJS.Timeout {
  const CHECK_INTERVAL = 5 * 60 * 1000;     // 5 minutes
  const CLEANUP_INTERVAL = 18 * 60 * 60 * 1000; // 18 hours

  // Run once at startup
  sendClassStartingSoonNotifications().catch((err) =>
    logger.error("Notification scheduler error:", err)
  );

  // Run cleanup once at startup (delayed 30s to not block boot)
  setTimeout(() => {
    cleanupNotifications().catch((err) =>
      logger.error("Notification cleanup startup error:", err)
    );
  }, 30_000);

  // Recurring cleanup every 6 hours
  setInterval(() => {
    cleanupNotifications().catch((err) =>
      logger.error("Notification cleanup error:", err)
    );
  }, CLEANUP_INTERVAL);

  return setInterval(() => {
    sendClassStartingSoonNotifications().catch((err) =>
      logger.error("Notification scheduler error:", err)
    );
  }, CHECK_INTERVAL);
}

/** Expose for maintenance panel manual trigger */
export { cleanupNotifications };

