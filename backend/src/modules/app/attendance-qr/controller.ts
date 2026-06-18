import { Request, Response } from "express";
import { qrAttendanceService } from "../../dashboard/attendance/qr.service";
import { logger } from "../../../utils/logger";

/**
 * App attendance-QR controller (TEACHER) — generate / fetch the daily QR code
 * for a batch so students can self-mark attendance by scanning it.
 * Reuses the dashboard qrAttendanceService. Pairs with re-enabling the
 * student "/app/attendance/mark-qr" route (see INTEGRATION.md, C9).
 */
export class AppAttendanceQrController {
  // POST /app/attendance/teacher/qr-token  { batchId, forceRegenerate? }
  async generate(req: Request, res: Response) {
    try {
      const batchId = Number(req.body?.batchId);
      if (!batchId) return res.status(400).json({ success: false, message: "batchId is required" });
      const force = req.body?.forceRegenerate === true || req.body?.forceRegenerate === "true";
      const data = await qrAttendanceService.generateBatchQRCode(batchId, force);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAttendanceQr.generate error:", error);
      const msg = error instanceof Error ? error.message : "Failed to generate QR code";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }

  // GET /app/attendance/teacher/qr-status/:batchId
  async status(req: Request, res: Response) {
    try {
      const data = await qrAttendanceService.getQRCodeStatus(Number(req.params.batchId));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppAttendanceQr.status error:", error);
      return res.status(500).json({ success: false, message: "Failed to load QR status" });
    }
  }
}

export const appAttendanceQrController = new AppAttendanceQrController();
