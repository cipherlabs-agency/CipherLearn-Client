import { Prisma } from "../../../../prisma/generated/prisma/client";
import { prisma } from "../../../config/db.config";
import { cacheService } from "../../../cache";
import { DashboardKeys, InvalidationPatterns } from "../../../cache/keys";
import * as TTL from "../../../cache/ttl";

export interface TeacherPermissions {
  canManageLectures: boolean;
  canUploadNotes: boolean;
  canUploadVideos: boolean;
  canManageAssignments: boolean;
  canViewFees: boolean;
  canManageStudyMaterials: boolean;
  canSendAnnouncements: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

export interface UpdateSettingsInput {
  className?: string;
  classEmail?: string;
  classPhone?: string;
  classAddress?: string;
  classWebsite?: string;
  teacherPermissions?: TeacherPermissions;
}

export const DEFAULT_TEACHER_PERMISSIONS: TeacherPermissions = {
  canManageLectures: true,
  canUploadNotes: true,
  canUploadVideos: false,
  canManageAssignments: true,
  canViewFees: false,
  canManageStudyMaterials: false,
  canSendAnnouncements: true,
  canViewAnalytics: false,
  canExportData: false,
};

export class SettingsService {
  /** Get current settings (creates defaults if not yet saved) */
  async getSettings() {
    return cacheService.getOrSet(
      DashboardKeys.settings(),
      async () => {
        const existing = await prisma.appSettings.findUnique({ where: { id: 1 } });
        if (existing) return existing;
        return prisma.appSettings.create({ data: { id: 1 } });
      },
      TTL.SETTINGS
    );
  }

  /** Update settings (partial update) */
  async updateSettings(data: UpdateSettingsInput) {
    cacheService.delByPrefix(InvalidationPatterns.dashSettings);
    return prisma.appSettings.upsert({
      where: { id: 1 },
      update: {
        ...(data.className !== undefined && { className: data.className }),
        ...(data.classEmail !== undefined && { classEmail: data.classEmail }),
        ...(data.classPhone !== undefined && { classPhone: data.classPhone }),
        ...(data.classAddress !== undefined && { classAddress: data.classAddress }),
        ...(data.classWebsite !== undefined && { classWebsite: data.classWebsite }),
        ...(data.teacherPermissions !== undefined && {
          teacherPermissions: data.teacherPermissions as unknown as Prisma.InputJsonValue,
        }),
      },
      create: {
        id: 1,
        className: data.className ?? "My Coaching Class",
        classEmail: data.classEmail ?? "",
        classPhone: data.classPhone ?? "",
        classAddress: data.classAddress ?? "",
        classWebsite: data.classWebsite ?? "",
        teacherPermissions: (data.teacherPermissions ?? DEFAULT_TEACHER_PERMISSIONS) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /** Reset teacher permissions to defaults */
  async resetTeacherPermissions() {
    return prisma.appSettings.upsert({
      where: { id: 1 },
      update: { teacherPermissions: DEFAULT_TEACHER_PERMISSIONS as unknown as Prisma.InputJsonValue },
      create: { id: 1, teacherPermissions: DEFAULT_TEACHER_PERMISSIONS as unknown as Prisma.InputJsonValue },
    });
  }
}

export const settingsService = new SettingsService();
