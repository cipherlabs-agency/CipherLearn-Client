import { Request, Response } from "express";
import { settingsService } from "../../dashboard/settings/service";
import { logger } from "../../../utils/logger";

/**
 * App admin settings controller — lets an ADMIN read/update class branding,
 * contact info, and teacher permissions from the mobile app. Reuses the
 * dashboard settingsService (which also invalidates its settings cache).
 */
export class AppSettingsAdminController {
  // GET /app/admin/settings  (full settings, admin view)
  async getSettings(_req: Request, res: Response) {
    try {
      const data = await settingsService.getSettings();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppSettingsAdmin.getSettings error:", error);
      return res.status(500).json({ success: false, message: "Failed to load settings" });
    }
  }

  // PUT /app/admin/settings
  // Body: { className?, classEmail?, classPhone?, classAddress?, classWebsite?, teacherPermissions? }
  async updateSettings(req: Request, res: Response) {
    try {
      const data = await settingsService.updateSettings(req.body || {});
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppSettingsAdmin.updateSettings error:", error);
      return res.status(500).json({ success: false, message: "Failed to update settings" });
    }
  }

  // PUT /app/admin/settings/teacher-permissions
  // Body: a partial TeacherPermissions map, e.g. { canViewFees: true, canViewAnalytics: false }
  async updateTeacherPermissions(req: Request, res: Response) {
    try {
      const data = await settingsService.updateSettings({ teacherPermissions: req.body || {} });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppSettingsAdmin.updateTeacherPermissions error:", error);
      return res.status(500).json({ success: false, message: "Failed to update teacher permissions" });
    }
  }

  // POST /app/admin/settings/teacher-permissions/reset
  async resetTeacherPermissions(_req: Request, res: Response) {
    try {
      const data = await settingsService.resetTeacherPermissions();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppSettingsAdmin.resetTeacherPermissions error:", error);
      return res.status(500).json({ success: false, message: "Failed to reset teacher permissions" });
    }
  }
}

export const appSettingsAdminController = new AppSettingsAdminController();
