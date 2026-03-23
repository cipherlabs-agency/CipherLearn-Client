import type { Request, Response } from "express";
import MaintenanceService from "./service";
import { log } from "../../../utils/logtail";

const service = new MaintenanceService();

export default class MaintenanceController {
  /**
   * POST /maintenance/auth
   * Verify maintenance password
   */
  async authenticate(req: Request, res: Response): Promise<Response> {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: "Password is required" });
      }

      const valid = await service.verifyPassword(password);
      if (!valid) {
        return res.status(403).json({ success: false, message: "Invalid maintenance password" });
      }

      return res.status(200).json({ success: true, message: "Maintenance mode unlocked" });
    } catch (error: any) {
      log("error", "maintenance.authenticate failed", { err: error.message });
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * POST /maintenance/seed
   * Seed N students + related data
   */
  async seed(req: Request, res: Response): Promise<Response> {
    try {
      const { password, count = 100, batchId } = req.body;

      // Re-verify password for destructive ops
      const valid = await service.verifyPassword(password);
      if (!valid) {
        return res.status(403).json({ success: false, message: "Invalid maintenance password" });
      }

      if (count < 1 || count > 500) {
        return res.status(400).json({ success: false, message: "Count must be between 1 and 500" });
      }

      const result = await service.seed(count, batchId || undefined);
      return res.status(201).json({
        success: true,
        message: `Seeded ${result.summary.students} students with full data`,
        data: result,
      });
    } catch (error: any) {
      log("error", "maintenance.seed failed", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /maintenance/status
   * Get counts of seeded data
   */
  async getStatus(req: Request, res: Response): Promise<Response> {
    try {
      const status = await service.getStatus();
      return res.status(200).json({ success: true, data: status });
    } catch (error: any) {
      log("error", "maintenance.getStatus failed", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /maintenance/cleanup
   * Nuke all SEED-tagged data
   */
  async cleanup(req: Request, res: Response): Promise<Response> {
    try {
      const { password } = req.body;

      // Re-verify password for destructive ops
      const valid = await service.verifyPassword(password);
      if (!valid) {
        return res.status(403).json({ success: false, message: "Invalid maintenance password" });
      }

      const result = await service.cleanup();
      return res.status(200).json({
        success: true,
        message: "All seed data has been purged",
        data: result,
      });
    } catch (error: any) {
      log("error", "maintenance.cleanup failed", { err: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
