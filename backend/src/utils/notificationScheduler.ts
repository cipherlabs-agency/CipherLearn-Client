/**
 * Notification Scheduler
 *
 * Runs background tasks for time-sensitive push notifications.
 * Currently handles: "Class Starting Soon" (10 minutes before lecture).
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

/**
 * Start the notification scheduler (runs every 5 minutes).
 * Returns the interval handle so it can be cleared if needed.
 */
export function startNotificationScheduler(): NodeJS.Timeout {
  const INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Run once at startup to catch any already-imminent classes
  sendClassStartingSoonNotifications().catch((err) =>
    logger.error("Notification scheduler error:", err)
  );

  return setInterval(() => {
    sendClassStartingSoonNotifications().catch((err) =>
      logger.error("Notification scheduler error:", err)
    );
  }, INTERVAL);
}
