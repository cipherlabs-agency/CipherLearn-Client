import { Request, Response } from "express";
import { settingsService, UpdateSettingsInput } from "./service";

export class SettingsController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch settings";
      res.status(500).json({ success: false, message });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const data: UpdateSettingsInput = req.body;
      const settings = await settingsService.updateSettings(data);
      res.json({ success: true, message: "Settings updated successfully", data: settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update settings";
      res.status(500).json({ success: false, message });
    }
  }

  async resetTeacherPermissions(req: Request, res: Response): Promise<void> {
    try {
      const settings = await settingsService.resetTeacherPermissions();
      res.json({ success: true, message: "Teacher permissions reset to defaults", data: settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset permissions";
      res.status(500).json({ success: false, message });
    }
  }
}

export const settingsController = new SettingsController();
