import { prisma } from "../../../config/db.config";
import { cacheService } from "../../../cache/index";
import { AppKeys, InvalidationPatterns } from "../../../cache/keys";
import { APP_NOTIF_PREFS } from "../../../cache/ttl";
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "./types";

// ─── Default preferences (matches DB defaults) ───────────────────────────────
const DEFAULT_PREFERENCES: NotificationPreferences = {
  academicAlerts: {
    classStartingSoon: true,
    timetableChanges: true,
  },
  examsResults: {
    newTestScheduled: true,
    resultPublished: true,
  },
  materialsUpdates: {
    newStudyMaterial: true,
    classResourceUploaded: false,
  },
  administrative: {
    schoolAnnouncements: true,
    doubtResponses: true,
  },
  quietHours: {
    enabled: false,
    from: "22:00",
    to: "07:00",
  },
};

// ─── Time format validator ────────────────────────────────────────────────────
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

class NotificationsService {
  /**
   * Map DB record → structured NotificationPreferences
   */
  private mapToPreferences(record: {
    classStartingSoon: boolean;
    timetableChanges: boolean;
    newTestScheduled: boolean;
    resultPublished: boolean;
    newStudyMaterial: boolean;
    classResourceUploaded: boolean;
    schoolAnnouncements: boolean;
    doubtResponses: boolean;
    quietHoursEnabled: boolean;
    quietHoursFrom: string;
    quietHoursTo: string;
  }): NotificationPreferences {
    return {
      academicAlerts: {
        classStartingSoon: record.classStartingSoon,
        timetableChanges: record.timetableChanges,
      },
      examsResults: {
        newTestScheduled: record.newTestScheduled,
        resultPublished: record.resultPublished,
      },
      materialsUpdates: {
        newStudyMaterial: record.newStudyMaterial,
        classResourceUploaded: record.classResourceUploaded,
      },
      administrative: {
        schoolAnnouncements: record.schoolAnnouncements,
        doubtResponses: record.doubtResponses,
      },
      quietHours: {
        enabled: record.quietHoursEnabled,
        from: record.quietHoursFrom,
        to: record.quietHoursTo,
      },
    };
  }

  /**
   * Get preferences for a student.
   * Returns defaults if no record exists yet (first-time user).
   */
  async getPreferences(studentId: number): Promise<NotificationPreferences> {
    const cacheKey = AppKeys.notifPrefs(studentId);

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const record = await prisma.notificationPreference.findUnique({
          where: { studentId },
        });

        if (!record) {
          return DEFAULT_PREFERENCES;
        }

        return this.mapToPreferences(record);
      },
      APP_NOTIF_PREFS
    );
  }

  /**
   * Save (upsert) preferences for a student.
   * Accepts a partial update — only provided fields are changed.
   * Returns the full updated preferences object.
   */
  async updatePreferences(
    studentId: number,
    input: UpdateNotificationPreferencesInput
  ): Promise<NotificationPreferences> {
    // Validate quiet hours time format if provided
    if (input.quietHours?.from !== undefined) {
      if (!TIME_REGEX.test(input.quietHours.from)) {
        throw new Error("quietHours.from must be in HH:MM format (24-hour)");
      }
    }
    if (input.quietHours?.to !== undefined) {
      if (!TIME_REGEX.test(input.quietHours.to)) {
        throw new Error("quietHours.to must be in HH:MM format (24-hour)");
      }
    }

    // Fetch existing (or use defaults) to merge with partial update
    const existing = await this.getPreferences(studentId);

    const merged: NotificationPreferences = {
      academicAlerts: {
        ...existing.academicAlerts,
        ...input.academicAlerts,
      },
      examsResults: {
        ...existing.examsResults,
        ...input.examsResults,
      },
      materialsUpdates: {
        ...existing.materialsUpdates,
        ...input.materialsUpdates,
      },
      administrative: {
        ...existing.administrative,
        ...input.administrative,
      },
      quietHours: {
        ...existing.quietHours,
        ...input.quietHours,
      },
    };

    const updated = await prisma.notificationPreference.upsert({
      where: { studentId },
      create: {
        studentId,
        classStartingSoon: merged.academicAlerts.classStartingSoon,
        timetableChanges: merged.academicAlerts.timetableChanges,
        newTestScheduled: merged.examsResults.newTestScheduled,
        resultPublished: merged.examsResults.resultPublished,
        newStudyMaterial: merged.materialsUpdates.newStudyMaterial,
        classResourceUploaded: merged.materialsUpdates.classResourceUploaded,
        schoolAnnouncements: merged.administrative.schoolAnnouncements,
        doubtResponses: merged.administrative.doubtResponses,
        quietHoursEnabled: merged.quietHours.enabled,
        quietHoursFrom: merged.quietHours.from,
        quietHoursTo: merged.quietHours.to,
      },
      update: {
        classStartingSoon: merged.academicAlerts.classStartingSoon,
        timetableChanges: merged.academicAlerts.timetableChanges,
        newTestScheduled: merged.examsResults.newTestScheduled,
        resultPublished: merged.examsResults.resultPublished,
        newStudyMaterial: merged.materialsUpdates.newStudyMaterial,
        classResourceUploaded: merged.materialsUpdates.classResourceUploaded,
        schoolAnnouncements: merged.administrative.schoolAnnouncements,
        doubtResponses: merged.administrative.doubtResponses,
        quietHoursEnabled: merged.quietHours.enabled,
        quietHoursFrom: merged.quietHours.from,
        quietHoursTo: merged.quietHours.to,
      },
    });

    // Invalidate cached preferences for this student
    cacheService.delByPrefix(InvalidationPatterns.appNotifPrefs);

    return this.mapToPreferences(updated);
  }
}

export const notificationsService = new NotificationsService();
