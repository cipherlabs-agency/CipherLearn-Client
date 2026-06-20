import { Request, Response } from "express";
import StudentEnrollmentService from "../../dashboard/student-enrollment/service";
import logger from "../../../utils/logger";

/**
 * App student CSV import controller (ADMIN). Reuses the dashboard
 * StudentEnrollmentService CSV preview/import + sample template.
 * The file is uploaded as multipart field "file" (memory storage).
 */
const studentEnrollmentService = new StudentEnrollmentService();

export class AppStudentsCsvController {
  // GET /app/admin/students-csv/template  → returns CSV text
  async downloadTemplate(_req: Request, res: Response) {
    try {
      const csv = studentEnrollmentService.getSampleCSV();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=student_import_template.csv");
      return res.status(200).send(csv);
    } catch (error) {
      logger.error("AppStudentsCsv.downloadTemplate error:", error);
      return res.status(500).json({ success: false, message: "Failed to generate template" });
    }
  }

  // POST /app/admin/students-csv/preview  (multipart: file, body: batchId)
  async preview(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "CSV file is required (field 'file')" });
      const batchId = Number(req.body.batchId);
      if (!batchId) return res.status(400).json({ success: false, message: "batchId is required" });
      const content = req.file.buffer.toString("utf-8");
      const preview = await studentEnrollmentService.previewCSV(content, batchId);
      return res.status(200).json({ success: true, data: preview });
    } catch (error) {
      logger.error("AppStudentsCsv.preview error:", error);
      const msg = error instanceof Error ? error.message : "Failed to preview CSV";
      return res.status(500).json({ success: false, message: msg });
    }
  }

  // POST /app/admin/students-csv/import  (multipart: file, body: batchId)
  async import(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "CSV file is required (field 'file')" });
      const batchId = Number(req.body.batchId);
      if (!batchId) return res.status(400).json({ success: false, message: "batchId is required" });
      const content = req.file.buffer.toString("utf-8");
      const result = await studentEnrollmentService.enrollCSV(content, batchId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      logger.error("AppStudentsCsv.import error:", error);
      const msg = error instanceof Error ? error.message : "Failed to import CSV";
      return res.status(500).json({ success: false, message: msg });
    }
  }
}

export const appStudentsCsvController = new AppStudentsCsvController();
