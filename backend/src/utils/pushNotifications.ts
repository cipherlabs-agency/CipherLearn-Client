/**
 * Push Notification Utility — Expo Push API
 *
 * Sends push notifications via Expo's notification service.
 * Respects student notification preferences and quiet hours.
 *
 * Device tokens are stored in the DeviceToken table.
 * Token format: ExponentPushToken[xxxxxxxx]
 */

import { prisma } from "../config/db.config";
import logger from "./logger";
import { log } from "./logtail";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StudentPrefKey =
  | "classStartingSoon"
  | "timetableChanges"
  | "newTestScheduled"
  | "resultPublished"
  | "newStudyMaterial"
  | "classResourceUploaded"
  | "schoolAnnouncements"
  | "doubtResponses";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

// ─── Quiet hours check ────────────────────────────────────────────────────────

function isInQuietHours(enabled: boolean, from: string, to: string): boolean {
  if (!enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const fromMinutes = fh * 60 + fm;
  const toMinutes = th * 60 + tm;

  // Handle overnight ranges (e.g., 22:00 to 07:00)
  if (fromMinutes > toMinutes) {
    return currentMinutes >= fromMinutes || currentMinutes < toMinutes;
  }
  return currentMinutes >= fromMinutes && currentMinutes < toMinutes;
}

// ─── Core send function ───────────────────────────────────────────────────────

async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error("Expo push API error:", { status: response.status, body: text });
      return;
    }

    const result = await response.json() as { data: Array<{ status: string; message?: string }> };
    const failures = result.data?.filter((r) => r.status === "error") ?? [];
    if (failures.length > 0) {
      logger.warn(`Push notification failures: ${failures.length}/${messages.length}`, failures);
    }
  } catch (error) {
    log("error", "warn.warn failed", { err: error instanceof Error ? error.message : String(error) });
    logger.error("Failed to send push notifications:", error);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a push notification to a single user (student or teacher).
 * No preference check — use sendToBatchStudents for preference-aware sends.
 */
export async function sendToUser(
  userId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = (tokens as { token: string }[]).map((t) => ({
    to: t.token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  await sendExpoPushMessages(messages);
}

/**
 * Send a push notification to all students in a batch.
 * Checks each student's notification preferences and quiet hours.
 * Fire-and-forget safe — logs errors internally.
 */
export async function sendToBatchStudents(
  batchId: number,
  prefKey: StudentPrefKey,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const rows = await prisma.deviceToken.findMany({
    where: {
      user: {
        student: { batchId, isDeleted: false },
      },
    },
    include: {
      user: {
        select: {
          student: {
            select: {
              notificationPreference: true,
            },
          },
        },
      },
    },
  });

  const messages: ExpoPushMessage[] = [];

  for (const row of rows) {
    const pref = row.user.student?.notificationPreference;

    // Default: send if no preference record
    const prefValue = pref ? (pref as Record<string, unknown>)[prefKey] as boolean : true;
    if (prefValue === false) continue;

    // Quiet hours check
    if (
      pref &&
      isInQuietHours(
        pref.quietHoursEnabled,
        pref.quietHoursFrom,
        pref.quietHoursTo
      )
    ) {
      continue;
    }

    messages.push({ to: row.token, title, body, data, sound: "default", priority: "high" });
  }

  await sendExpoPushMessages(messages);
}

/**
 * Send a notification to the teacher assigned to a batch (via most recent lecture).
 */
export async function sendToTeacherOfBatch(
  batchId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const lecture = await prisma.lecture.findFirst({
    where: { batchId, isDeleted: false, teacherId: { not: null } },
    orderBy: { date: "desc" },
    select: { teacherId: true },
  });

  if (!lecture?.teacherId) return;

  await sendToUser(lecture.teacherId, title, body, data);
}

/**
 * Send a notification to all active students in the system (for class-wide announcements).
 * Checks each student's notification preference for the given key.
 */
export async function sendToAllActiveStudents(
  prefKey: StudentPrefKey,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const rows = await prisma.deviceToken.findMany({
    where: {
      user: {
        student: { isDeleted: false },
      },
    },
    include: {
      user: {
        select: {
          student: {
            select: {
              notificationPreference: true,
            },
          },
        },
      },
    },
  });

  const messages: ExpoPushMessage[] = [];

  for (const row of rows) {
    const pref = row.user.student?.notificationPreference;
    const prefValue = pref ? (pref as Record<string, unknown>)[prefKey] as boolean : true;
    if (prefValue === false) continue;

    if (pref && isInQuietHours(pref.quietHoursEnabled, pref.quietHoursFrom, pref.quietHoursTo)) {
      continue;
    }

    messages.push({ to: row.token, title, body, data, sound: "default", priority: "high" });
  }

  await sendExpoPushMessages(messages);
}

/**
 * Send to all teachers who teach a given batch (via distinct lecture assignments).
 */
export async function sendToAllTeachersOfBatch(
  batchId: number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const lectures = await prisma.lecture.findMany({
    where: { batchId, isDeleted: false, teacherId: { not: null } },
    select: { teacherId: true },
    distinct: ["teacherId"],
  });

  for (const l of lectures) {
    if (l.teacherId) {
      await sendToUser(l.teacherId, title, body, data);
    }
  }
}
