/**
 * Push Notification Utility — OneSignal REST API
 *
 * Sends push notifications via OneSignal's REST API.
 * Respects student notification preferences and quiet hours.
 *
 * Uses OneSignal's `include_external_user_ids` to target users.
 * The React Native app must call `OneSignal.setExternalUserId(userId)` after login.
 *
 * Migration note: Replaced Expo Push API (ExpoPushToken) with OneSignal.
 * All public function signatures remain identical for backward compatibility.
 */

import { prisma } from "../config/db.config";
import { config } from "../config/env.config";
import logger from "./logger";
import { log } from "./logtail";

const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

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

interface OneSignalPayload {
  app_id: string;
  include_external_user_ids: string[];
  contents: { en: string };
  headings: { en: string };
  data?: Record<string, unknown>;
  priority?: number; // 10 = high
  // Android-specific
  android_channel_id?: string;
  small_icon?: string;
  // iOS-specific
  ios_sound?: string;
}

export interface OneSignalResponse {
  id: string;
  recipients: number;
  errors?: string[];
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

// ─── Core OneSignal send function ─────────────────────────────────────────────

async function sendOneSignalNotification(
  externalUserIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<OneSignalResponse | null> {
  if (externalUserIds.length === 0) {
    logger.warn("[OneSignal] No external user IDs provided, skipping send");
    return null;
  }

  const appId = config.ONESIGNAL.APP_ID;
  const apiKey = config.ONESIGNAL.REST_API_KEY;

  if (!appId || !apiKey) {
    logger.error("[OneSignal] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY in env");
    log("error", "onesignal.missing_config", { appId: !!appId, apiKey: !!apiKey });
    return null;
  }

  const payload: OneSignalPayload = {
    app_id: appId,
    include_external_user_ids: externalUserIds,
    headings: { en: title },
    contents: { en: body },
    data: data || {},
    priority: 10,
  };

  logger.info(`[OneSignal] Sending notification to ${externalUserIds.length} user(s)`, {
    title,
    body,
    userIds: externalUserIds.slice(0, 10), // Log first 10 for debugging
    totalRecipients: externalUserIds.length,
  });

  try {
    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey.startsWith("os_v2_") ? `Key ${apiKey}` : `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as any;

    if (!response.ok) {
      logger.error("[OneSignal] API error response", {
        status: response.status,
        statusText: response.statusText,
        errors: result.errors,
        body: JSON.stringify(result).slice(0, 500),
      });
      log("error", "onesignal.api_error", {
        status: response.status,
        errors: result.errors,
      });
      return null;
    }

    logger.info("[OneSignal] Notification sent successfully", {
      notificationId: result.id,
      recipients: result.recipients,
    });

    log("warn", "onesignal.sent", {
      notificationId: result.id,
      recipients: result.recipients,
      title,
    });

    return {
      id: result.id,
      recipients: result.recipients,
      errors: result.errors,
    };
  } catch (error) {
    logger.error("[OneSignal] Network/fetch error", {
      err: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    log("error", "onesignal.network_error", {
      err: error instanceof Error ? error.message : String(error),
    });
    return null;
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
  logger.info(`[OneSignal] sendToUser: userId=${userId}`, { title });
  await sendOneSignalNotification([String(userId)], title, body, data);
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
  logger.info(`[OneSignal] sendToBatchStudents: batchId=${batchId}, prefKey=${prefKey}`, { title });

  const students = await prisma.student.findMany({
    where: { batchId, isDeleted: false },
    select: {
      userId: true,
      notificationPreference: true,
    },
  });

  const eligibleUserIds: string[] = [];

  for (const student of students) {
    if (!student.userId) continue;

    const pref = student.notificationPreference;

    // Default: send if no preference record
    const prefValue = pref ? (pref as Record<string, unknown>)[prefKey] as boolean : true;
    if (prefValue === false) continue;

    // Quiet hours check
    if (
      pref &&
      isInQuietHours(pref.quietHoursEnabled, pref.quietHoursFrom, pref.quietHoursTo)
    ) {
      continue;
    }

    eligibleUserIds.push(String(student.userId));
  }

  logger.info(`[OneSignal] sendToBatchStudents: ${eligibleUserIds.length}/${students.length} eligible`, {
    batchId,
    prefKey,
  });

  if (eligibleUserIds.length > 0) {
    await sendOneSignalNotification(eligibleUserIds, title, body, data);
  }
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
  logger.info(`[OneSignal] sendToTeacherOfBatch: batchId=${batchId}`, { title });

  const lecture = await prisma.lecture.findFirst({
    where: { batchId, isDeleted: false, teacherId: { not: null } },
    orderBy: { date: "desc" },
    select: { teacherId: true },
  });

  if (!lecture?.teacherId) {
    logger.warn(`[OneSignal] sendToTeacherOfBatch: no teacher found for batchId=${batchId}`);
    return;
  }

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
  logger.info(`[OneSignal] sendToAllActiveStudents: prefKey=${prefKey}`, { title });

  const students = await prisma.student.findMany({
    where: { isDeleted: false, userId: { not: null } },
    select: {
      userId: true,
      notificationPreference: true,
    },
  });

  const eligibleUserIds: string[] = [];

  for (const student of students) {
    if (!student.userId) continue;

    const pref = student.notificationPreference;
    const prefValue = pref ? (pref as Record<string, unknown>)[prefKey] as boolean : true;
    if (prefValue === false) continue;

    if (pref && isInQuietHours(pref.quietHoursEnabled, pref.quietHoursFrom, pref.quietHoursTo)) {
      continue;
    }

    eligibleUserIds.push(String(student.userId));
  }

  logger.info(`[OneSignal] sendToAllActiveStudents: ${eligibleUserIds.length}/${students.length} eligible`);

  if (eligibleUserIds.length > 0) {
    await sendOneSignalNotification(eligibleUserIds, title, body, data);
  }
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
  logger.info(`[OneSignal] sendToAllTeachersOfBatch: batchId=${batchId}`, { title });

  const lectures = await prisma.lecture.findMany({
    where: { batchId, isDeleted: false, teacherId: { not: null } },
    select: { teacherId: true },
    distinct: ["teacherId"],
  });

  const teacherIds = lectures
    .filter((l) => l.teacherId !== null)
    .map((l) => String(l.teacherId));

  if (teacherIds.length > 0) {
    await sendOneSignalNotification(teacherIds, title, body, data);
  }
}

/**
 * Debug utility: send a raw OneSignal notification to specific external user IDs.
 * Used by the Maintenance Mode test endpoint.
 */
export async function sendTestNotification(
  externalUserIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<OneSignalResponse | null> {
  logger.info("[OneSignal] sendTestNotification (debug)", {
    externalUserIds,
    title,
    body,
  });
  return sendOneSignalNotification(externalUserIds, title, body, data);
}
