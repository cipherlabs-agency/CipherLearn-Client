import { Request, Response } from "express";
import StudentEnrollmentService from "../../dashboard/student-enrollment/service";
import BatchService from "../../dashboard/batches/service";
import logger from "../../../utils/logger";

/**
 * App data-recovery controller (ADMIN). Lists soft-deleted students/batches
 * and supports restore + permanent (hard) delete. Reuses dashboard services.
 */
const studentService = new StudentEnrollmentService();
const batchService = new BatchService();

const toIds = (body: any): number[] => {
  const raw = body?.ids;
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => !Number.isNaN(n));
  return [];
};

export class AppDataRecoveryController {
  // GET /app/admin/recovery/students
  async listDeletedStudents(_req: Request, res: Response) {
    try {
      const data = await studentService.getDeleted();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppDataRecovery.listDeletedStudents error:", error);
      return res.status(500).json({ success: false, message: "Failed to load deleted students" });
    }
  }

  // PUT /app/admin/recovery/students/restore  { ids: number[] }
  async restoreStudents(req: Request, res: Response) {
    try {
      const ids = toIds(req.body);
      if (!ids.length) return res.status(400).json({ success: false, message: "ids[] is required" });
      const data = await studentService.restore(ids);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppDataRecovery.restoreStudents error:", error);
      return res.status(500).json({ success: false, message: "Failed to restore students" });
    }
  }

  // DELETE /app/admin/recovery/students/:id
  async hardDeleteStudent(req: Request, res: Response) {
    try {
      await studentService.hardDelete(Number(req.params.id));
      return res.status(200).json({ success: true, message: "Student permanently deleted" });
    } catch (error) {
      logger.error("AppDataRecovery.hardDeleteStudent error:", error);
      const msg = error instanceof Error ? error.message : "Failed to delete student";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }

  // GET /app/admin/recovery/batches
  async listDeletedBatches(_req: Request, res: Response) {
    try {
      const data = await batchService.getDrafts();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppDataRecovery.listDeletedBatches error:", error);
      return res.status(500).json({ success: false, message: "Failed to load deleted batches" });
    }
  }

  // PUT /app/admin/recovery/batches/restore  { ids: number[] }
  async restoreBatches(req: Request, res: Response) {
    try {
      const ids = toIds(req.body);
      if (!ids.length) return res.status(400).json({ success: false, message: "ids[] is required" });
      const data = await batchService.restore(ids);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppDataRecovery.restoreBatches error:", error);
      return res.status(500).json({ success: false, message: "Failed to restore batches" });
    }
  }

  // DELETE /app/admin/recovery/batches/:id
  async hardDeleteBatch(req: Request, res: Response) {
    try {
      const data = await batchService.hardDelete(Number(req.params.id));
      return res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("AppDataRecovery.hardDeleteBatch error:", error);
      const msg = error instanceof Error ? error.message : "Failed to delete batch";
      return res.status(msg.includes("not found") ? 404 : 500).json({ success: false, message: msg });
    }
  }
}

export const appDataRecoveryController = new AppDataRecoveryController();
