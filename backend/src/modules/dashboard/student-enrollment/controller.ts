import type { Request, Response } from "express";
import StudentEnrollmentService from "./service";
import logger from "../../../utils/logger";
import { EnrollStudentInput } from "./types";

const studentEnrollmentService = new StudentEnrollmentService();

export default class StudentEnrollmentController {
  /**
   * Enroll a single student
   * POST /student-enrollment/enroll
   */
  public async enrollSingle(req: Request, res: Response) {
    try {
      const {
        dob,
        email,
        firstname,
        fullname,
        lastname,
        middlename,
        address,
        batchId,
      }: EnrollStudentInput = req.body;

      if (
        !firstname ||
        !lastname ||
        !address ||
        !batchId ||
        !dob ||
        !email
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required!",
        });
      }

      const student = await studentEnrollmentService.enrollSingle({
        dob,
        email,
        firstname,
        fullname,
        lastname,
        middlename: middlename || "",
        address,
        batchId,
      });

      logger.info(`Student enrolled: ${student.email}`);

      return res.status(201).json({
        success: true,
        message: "Student enrolled successfully",
        data: student,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.enrollSingle error:", error);

      if (error.message.includes("already exists")) {
        return res.status(409).json({ success: false, message: error.message });
      }

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Enrollment failed: ${error.message}`,
      });
    }
  }

  /**
   * Preview CSV data before importing
   * POST /student-enrollment/csv/preview
   */
  public async previewCSV(req: Request, res: Response) {
    try {
      const file = req.file;
      const { batchId } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "CSV file is required",
        });
      }

      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: "Batch ID is required",
        });
      }

      const fileContent = file.buffer.toString("utf-8");
      const preview = await studentEnrollmentService.previewCSV(
        fileContent,
        Number(batchId)
      );

      return res.status(200).json({
        success: true,
        message: "CSV preview generated",
        data: preview,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.previewCSV error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Preview failed: ${error.message}`,
      });
    }
  }

  /**
   * Import students from CSV
   * POST /student-enrollment/csv/import
   */
  public async enrollCSV(req: Request, res: Response) {
    try {
      const file = req.file;
      const { batchId } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "CSV file is required",
        });
      }

      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: "Batch ID is required",
        });
      }

      const fileContent = file.buffer.toString("utf-8");
      const result = await studentEnrollmentService.enrollCSV(
        fileContent,
        Number(batchId)
      );

      logger.info(
        `CSV Import: ${result.successful}/${result.total} students imported`
      );

      return res.status(200).json({
        success: true,
        message: `Import completed: ${result.successful} successful, ${result.failed} failed`,
        data: result,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.enrollCSV error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Import failed: ${error.message}`,
      });
    }
  }

  /**
   * Get all students (optionally by batch)
   * GET /student-enrollment/students/:id?
   */
  public async getAll(req: Request, res: Response) {
    try {
      const batchId = req.params.id ? Number(req.params.id) : undefined;

      const students = await studentEnrollmentService.getAll(batchId);
      return res.status(200).json({ success: true, data: students });
    } catch (error: any) {
      logger.error("StudentEnrollment.getAll error:", error);

      if (error.message === "Batch not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch students: ${error.message}`,
      });
    }
  }

  /**
   * Get a single student by ID
   * GET /student-enrollment/student/:id
   */
  public async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await studentEnrollmentService.getById(Number(id));
      return res.status(200).json({ success: true, data: student });
    } catch (error: any) {
      logger.error("StudentEnrollment.getById error:", error);

      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch student: ${error.message}`,
      });
    }
  }

  /**
   * Update a student
   * PUT /student-enrollment/student/:id
   */
  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const student = await studentEnrollmentService.update(Number(id), data);

      return res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: student,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.update error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }

      if (error.message.includes("already in use")) {
        return res.status(409).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Update failed: ${error.message}`,
      });
    }
  }

  /**
   * Delete a student
   * DELETE /student-enrollment/student/:id
   */
  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      await studentEnrollmentService.delete(Number(id), user.name);

      return res.status(200).json({
        success: true,
        message: "Student deleted successfully",
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.delete error:", error);

      if (error.message === "Student not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Delete failed: ${error.message}`,
      });
    }
  }

  /**
   * Download sample CSV template
   * GET /student-enrollment/csv/template
   */
  public async downloadTemplate(req: Request, res: Response) {
    try {
      const csv = studentEnrollmentService.getSampleCSV();

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=student_import_template.csv"
      );

      return res.send(csv);
    } catch (error: any) {
      logger.error("StudentEnrollment.downloadTemplate error:", error);

      return res.status(500).json({
        success: false,
        message: `Failed to generate template: ${error.message}`,
      });
    }
  }

  /**
   * Get the current authenticated user's student profile
   * GET /student-enrollment/my-profile
   * This endpoint matches the authenticated user's email with a student record
   */
  public async getMyProfile(req: Request, res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const student = await studentEnrollmentService.getByEmail(user.email);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "No student profile found for your account",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Student profile retrieved successfully",
        data: student,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.getMyProfile error:", error);

      return res.status(500).json({
        success: false,
        message: `Failed to fetch student profile: ${error.message}`,
      });
    }
  }

  /**
   * Get all soft-deleted students
   * GET /student-enrollment/deleted
   */
  public async getDeleted(req: Request, res: Response) {
    try {
      const students = await studentEnrollmentService.getDeleted();
      return res.status(200).json({ success: true, data: students });
    } catch (error: any) {
      logger.error("StudentEnrollment.getDeleted error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch deleted students: ${error.message}`,
      });
    }
  }

  /**
   * Restore soft-deleted students
   * PUT /student-enrollment/restore
   */
  public async restore(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "ids array is required",
        });
      }

      const result = await studentEnrollmentService.restore(ids);
      logger.info(`Students restored: ${ids.join(", ")}`);

      return res.status(200).json({
        success: true,
        message: `${result.restored} students restored`,
        data: result,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.restore error:", error);
      return res.status(500).json({
        success: false,
        message: `Restore failed: ${error.message}`,
      });
    }
  }

  // =====================
  // DANGER ZONE - HARD DELETE OPERATIONS
  // =====================

  /**
   * Permanently delete a student (DANGER: This cannot be undone!)
   * DELETE /student-enrollment/hard-delete/:id
   */
  public async hardDelete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await studentEnrollmentService.hardDelete(Number(id));

      logger.warn(`DANGER ZONE: Student ${id} permanently deleted by ${req.user?.name}`);

      return res.status(200).json({
        success: true,
        message: "Student permanently deleted",
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.hardDelete error:", error);

      return res.status(500).json({
        success: false,
        message: `Failed to permanently delete student: ${error.message}`,
      });
    }
  }

  /**
   * Permanently delete multiple students (DANGER: This cannot be undone!)
   * DELETE /student-enrollment/hard-delete-many
   */
  public async hardDeleteMany(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "ids array is required",
        });
      }

      const result = await studentEnrollmentService.hardDeleteMany(ids);

      logger.warn(`DANGER ZONE: ${result.deleted} students permanently deleted by ${req.user?.name}`);

      return res.status(200).json({
        success: true,
        message: `${result.deleted} students permanently deleted`,
        data: result,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.hardDeleteMany error:", error);

      return res.status(500).json({
        success: false,
        message: `Failed to permanently delete students: ${error.message}`,
      });
    }
  }

  /**
   * Purge all soft-deleted students (DANGER: This cannot be undone!)
   * DELETE /student-enrollment/purge-deleted
   */
  public async purgeDeleted(req: Request, res: Response) {
    try {
      const result = await studentEnrollmentService.purgeDeleted();

      logger.warn(`DANGER ZONE: ${result.deleted} soft-deleted students purged by ${req.user?.name}`);

      return res.status(200).json({
        success: true,
        message: `${result.deleted} soft-deleted students permanently removed`,
        data: result,
      });
    } catch (error: any) {
      logger.error("StudentEnrollment.purgeDeleted error:", error);

      return res.status(500).json({
        success: false,
        message: `Failed to purge deleted students: ${error.message}`,
      });
    }
  }
}
