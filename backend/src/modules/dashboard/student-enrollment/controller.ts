import type { Request, Response } from "express";
import type { ObjectSchema, ValidationError as JoiValidationError } from "joi";
import StudentEnrollmentService from "./service";
import logger from "../../../utils/logger";
import {
  formatErrorResponse,
  getStatusCode,
  BadRequestError,
  UnauthorizedError,
  ValidationError,
} from "../../../errors";
import { EnrollStudentInput, UpdateStudentInput } from "./types";
import { StudentValidations } from "./validation";
import { log } from "../../../utils/logtail";

const FEATURE = "student-enrollment" as const;
const studentEnrollmentService = new StudentEnrollmentService();

/**
 * Helper to handle Joi validation errors
 */
function handleJoiValidation<T>(
  schema: ObjectSchema<T>,
  data: unknown
): T {
  const { error, value } = schema.validate(data);
  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.map(String).join("."),
      message: detail.message.replace(/"/g, ""),
    }));
    throw new ValidationError("Validation failed", FEATURE, errors);
  }
  return value;
}

export default class StudentEnrollmentController {
  /**
   * Enroll a single student
   * POST /student-enrollment/enroll
   */
  public async enrollSingle(req: Request, res: Response) {
    try {
      const validatedData = handleJoiValidation(
        StudentValidations.enroll,
        req.body
      );

      const student = await studentEnrollmentService.enrollSingle(
        validatedData as EnrollStudentInput
      );

      logger.info(`Student enrolled: ${student.email}`);

      return res.status(201).json({
        success: true,
        message: "Student enrolled successfully",
        data: student,
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.enrollSingle error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
        throw new BadRequestError("CSV file is required", FEATURE);
      }

      if (!batchId) {
        throw new BadRequestError("Batch ID is required", FEATURE);
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
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.previewCSV error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
        throw new BadRequestError("CSV file is required", FEATURE);
      }

      if (!batchId) {
        throw new BadRequestError("Batch ID is required", FEATURE);
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
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.enrollCSV error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.getAll error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.getById error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Update a student
   * PUT /student-enrollment/student/:id
   */
  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const validatedData = handleJoiValidation(
        StudentValidations.update,
        req.body
      );

      const student = await studentEnrollmentService.update(
        Number(id),
        validatedData as UpdateStudentInput
      );

      return res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: student,
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.update error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
        throw new UnauthorizedError("Authentication required", FEATURE);
      }

      await studentEnrollmentService.delete(Number(id), user.name);

      return res.status(200).json({
        success: true,
        message: "Student deleted successfully",
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("StudentEnrollment.delete error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
    } catch (error) {
      log("error", "dashboard.student-enrollment.send failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.downloadTemplate error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
        throw new UnauthorizedError("Authentication required", FEATURE);
      }

      const student = await studentEnrollmentService.getByEmail(user.email);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "No student profile found for your account",
          code: "student-enrollment:not-found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Student profile retrieved successfully",
        data: student,
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("StudentEnrollment.getMyProfile error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.getDeleted error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Restore soft-deleted students
   * PUT /student-enrollment/restore
   */
  public async restore(req: Request, res: Response) {
    try {
      const validatedData = handleJoiValidation(
        StudentValidations.restore,
        req.body
      );

      const result = await studentEnrollmentService.restore(validatedData.ids);
      logger.info(`Students restored: ${validatedData.ids.join(", ")}`);

      return res.status(200).json({
        success: true,
        message: `${result.restored} students restored`,
        data: result,
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("StudentEnrollment.restore error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
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

      logger.warn(
        `DANGER ZONE: Student ${id} permanently deleted by ${req.user?.name}`
      );

      return res.status(200).json({
        success: true,
        message: "Student permanently deleted",
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("StudentEnrollment.hardDelete error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Permanently delete multiple students (DANGER: This cannot be undone!)
   * DELETE /student-enrollment/hard-delete-many
   */
  public async hardDeleteMany(req: Request, res: Response) {
    try {
      const validatedData = handleJoiValidation(
        StudentValidations.hardDeleteMany,
        req.body
      );

      const result = await studentEnrollmentService.hardDeleteMany(
        validatedData.ids
      );

      logger.warn(
        `DANGER ZONE: ${result.deleted} students permanently deleted by ${req.user?.name}`
      );

      return res.status(200).json({
        success: true,
        message: `${result.deleted} students permanently deleted`,
        data: result,
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("StudentEnrollment.hardDeleteMany error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
    }
  }

  /**
   * Purge all soft-deleted students (DANGER: This cannot be undone!)
   * DELETE /student-enrollment/purge-deleted
   */
  public async purgeDeleted(req: Request, res: Response) {
    try {
      const result = await studentEnrollmentService.purgeDeleted();

      logger.warn(
        `DANGER ZONE: ${result.deleted} soft-deleted students purged by ${req.user?.name}`
      );

      return res.status(200).json({
        success: true,
        message: `${result.deleted} soft-deleted students permanently removed`,
        data: result,
      });
    } catch (error) {
      log("error", "dashboard.student-enrollment.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("StudentEnrollment.purgeDeleted error:", error);

      const statusCode = getStatusCode(error);
      return res.status(statusCode).json(formatErrorResponse(error));
    }
  }
}
