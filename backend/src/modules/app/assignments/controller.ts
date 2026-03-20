import type { Request, Response } from "express";
import { assignmentsService } from "./service";
import logger from "../../../utils/logger";
import { UserRoles } from "../../../../prisma/generated/prisma/enums";
import CloudinaryService from "../../../config/cloudinairy.config";
import { validateMagicNumber } from "../../../config/multer.config";
import type {
  CreateSubmissionInput,
  ReviewSubmissionInput,
  SubmissionFile,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "./types";
import { log } from "../../../utils/logtail";

const cloudinaryService = new CloudinaryService();

class AssignmentsController {
  // ==================== STUDENT ENDPOINTS ====================

  /**
   * Get assignments for student
   * GET /app/assignments
   */
  async getAssignments(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Students get their assignments
      if (user.role === UserRoles.STUDENT) {
        const student = req.student;
        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student profile not found",
          });
        }

        const statusFilter = req.query.status as "pending" | "completed" | undefined;
        const validStatuses = ["pending", "completed"];
        if (statusFilter && !validStatuses.includes(statusFilter)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status filter. Use: pending, completed",
          });
        }

        const assignments = await assignmentsService.getStudentAssignments(
          student.id,
          student.batchId,
          statusFilter
        );

        return res.status(200).json({
          success: true,
          data: assignments,
        });
      }

      // Teachers/Admins get assignments with stats
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const includeExpired = req.query.includeExpired !== "false";

      const result = await assignmentsService.getAssignmentsWithStats({
        batchId,
        page,
        limit,
        includeExpired,
      });

      return res.status(200).json({
        success: true,
        data: result.slots,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getAssignments error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get assignments: ${error}`,
      });
    }
  }

  /**
   * Get single assignment
   * GET /app/assignments/:id
   */
  async getAssignmentById(req: Request, res: Response) {
    try {
      const user = req.user;
      const slotId = Number(req.params.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      if (isNaN(slotId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment ID",
        });
      }

      // Students get assignment with their submission
      if (user.role === UserRoles.STUDENT) {
        const student = req.student;
        if (!student) {
          return res.status(404).json({
            success: false,
            message: "Student profile not found",
          });
        }

        const assignment = await assignmentsService.getAssignmentById(
          slotId,
          student.id
        );

        if (!assignment) {
          return res.status(404).json({
            success: false,
            message: "Assignment not found",
          });
        }

        return res.status(200).json({
          success: true,
          data: assignment,
        });
      }

      // Teachers/Admins - fetch with submissions
      const assignment = await assignmentsService.getAssignmentById(slotId, 0);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getAssignmentById error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get assignment: ${error}`,
      });
    }
  }

  /**
   * Submit assignment (student only)
   * POST /app/assignments/:id/submit
   */
  async submitAssignment(req: Request, res: Response) {
    try {
      const student = req.student;
      const slotId = Number(req.params.id);

      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      if (isNaN(slotId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment ID",
        });
      }

      // Validate and upload files to Cloudinary
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one file is required",
        });
      }

      // Validate magic numbers (file signature check) for security
      for (const file of files) {
        const isValid = validateMagicNumber(file.buffer, file.mimetype);
        if (!isValid) {
          return res.status(400).json({
            success: false,
            message: `File "${file.originalname}" failed security validation. Content does not match declared type.`,
          });
        }
      }

      // Upload all files to Cloudinary (submissions folder)
      let uploadedFiles: SubmissionFile[];
      try {
        const results = await cloudinaryService.uploadDocuments(files, "submissions");
        uploadedFiles = results.map((r) => ({
          url: r.url,
          publicId: r.public_id,
          originalFilename: r.original_filename,
          size: r.bytes,
          mimeType: files.find((f) => f.originalname === r.original_filename)?.mimetype ?? r.format,
        }));
      } catch (uploadError) {
        logger.error("AssignmentsController.submitAssignment Cloudinary error:", uploadError);
        return res.status(502).json({
          success: false,
          message: "File upload failed. Please try again.",
        });
      }

      // Optional text note from student
      const note = typeof req.body.note === "string" ? req.body.note.slice(0, 1000) : undefined;

      const data: CreateSubmissionInput = {
        slotId,
        files: uploadedFiles,
        note,
      };

      const submission = await assignmentsService.submitAssignment(
        student.id,
        data
      );

      return res.status(201).json({
        success: true,
        message: "Assignment submitted successfully",
        data: submission,
      });
    } catch (error: unknown) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AssignmentsController.submitAssignment error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit assignment";
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get my submission for an assignment (student)
   * GET /app/assignments/:id/my-submission
   */
  async getMySubmission(req: Request, res: Response) {
    try {
      const student = req.student;
      const slotId = Number(req.params.id);

      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      if (isNaN(slotId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment ID",
        });
      }

      const submission = await assignmentsService.getStudentSubmission(
        slotId,
        student.id
      );

      return res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AssignmentsController.getMySubmission error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get submission: ${error}`,
      });
    }
  }

  /**
   * Get my assignment stats (student)
   * GET /app/assignments/stats
   */
  async getMyStats(req: Request, res: Response) {
    try {
      const student = req.student;

      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const stats = await assignmentsService.getStudentStats(student.id);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AssignmentsController.getMyStats error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get stats: ${error}`,
      });
    }
  }

  // ==================== TEACHER/ADMIN ENDPOINTS ====================

  /**
   * Get submissions for an assignment slot
   * GET /app/assignments/:id/submissions
   */
  async getSlotSubmissions(req: Request, res: Response) {
    try {
      const user = req.user;
      const slotId = Number(req.params.id);

      if (!user || user.role === UserRoles.STUDENT) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      if (isNaN(slotId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment ID",
        });
      }

      const status = req.query.status as string | undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await assignmentsService.getSlotSubmissions(slotId, {
        status: status as "PENDING" | "ACCEPTED" | "REJECTED" | undefined,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result.submissions,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getSlotSubmissions error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get submissions: ${error}`,
      });
    }
  }

  /**
   * Get single submission details
   * GET /app/assignments/submissions/:submissionId
   */
  async getSubmissionById(req: Request, res: Response) {
    try {
      const user = req.user;
      const submissionId = Number(req.params.submissionId);

      if (!user || user.role === UserRoles.STUDENT) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      if (isNaN(submissionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid submission ID",
        });
      }

      const submission =
        await assignmentsService.getSubmissionById(submissionId);

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getSubmissionById error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get submission: ${error}`,
      });
    }
  }

  /**
   * Review a submission (teacher/admin)
   * PUT /app/assignments/submissions/:submissionId/review
   */
  async reviewSubmission(req: Request, res: Response) {
    try {
      const user = req.user;
      const submissionId = Number(req.params.submissionId);

      if (!user || user.role === UserRoles.STUDENT) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      if (isNaN(submissionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid submission ID",
        });
      }

      const { status, feedback } = req.body as ReviewSubmissionInput;

      if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be ACCEPTED or REJECTED",
        });
      }

      const submission = await assignmentsService.reviewSubmission(
        submissionId,
        user.name,
        { status, feedback }
      );

      return res.status(200).json({
        success: true,
        message: `Submission ${status.toLowerCase()}`,
        data: submission,
      });
    } catch (error) {
      log("error", "app.assignments.toLowerCase failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.reviewSubmission error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to review submission: ${error}`,
      });
    }
  }

  // ==================== TEACHER CRUD ENDPOINTS ====================

  /**
   * Create assignment for one or multiple batches
   * POST /app/assignments/teacher
   * Body (multipart/form-data):
   *   title, subject, description?, batchIds (JSON array), dueDate?,
   *   submissionType?, assignmentStatus?, allowLateSubmissions?, plagiarismCheck?
   *   files[] — optional assignment brief attachments (50MB each, max 5)
   */
  async createAssignment(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const {
        title,
        subject,
        description,
        batchIds: rawBatchIds,
        dueDate,
        submissionType,
        assignmentStatus,
        allowLateSubmissions,
        plagiarismCheck,
      } = req.body;

      if (!title?.trim() || !subject?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title and subject are required",
        });
      }

      let batchIds: number[];
      try {
        const parsed =
          typeof rawBatchIds === "string" ? JSON.parse(rawBatchIds) : rawBatchIds;
        batchIds = Array.isArray(parsed)
          ? parsed.map(Number).filter((n) => !isNaN(n))
          : [];
      } catch {
        return res.status(400).json({
          success: false,
          message: "batchIds must be a JSON array of numbers",
        });
      }

      if (batchIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one batch must be selected",
        });
      }

      // Upload attachment files to Cloudinary (optional)
      const files = req.files as Express.Multer.File[] | undefined;
      let attachments: SubmissionFile[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          const isValid = validateMagicNumber(file.buffer, file.mimetype);
          if (!isValid) {
            return res.status(400).json({
              success: false,
              message: `File "${file.originalname}" failed security validation`,
            });
          }
        }
        try {
          const results = await cloudinaryService.uploadDocuments(files, "assignments");
          attachments = results.map((r) => ({
            url: r.url,
            publicId: r.public_id,
            originalFilename: r.original_filename,
            size: r.bytes,
            mimeType:
              files.find((f) => f.originalname === r.original_filename)
                ?.mimetype ?? r.format,
          }));
        } catch (uploadError) {
          logger.error("createAssignment Cloudinary error:", uploadError);
          return res.status(502).json({
            success: false,
            message: "File upload failed. Please try again.",
          });
        }
      }

      const input: CreateAssignmentInput = {
        title,
        subject,
        description,
        batchIds,
        dueDate,
        submissionType,
        assignmentStatus:
          assignmentStatus === "DRAFT" ? "DRAFT" : "PUBLISHED",
        allowLateSubmissions: allowLateSubmissions === "true" || allowLateSubmissions === true,
        plagiarismCheck: plagiarismCheck === "true" || plagiarismCheck === true,
      };

      const slots = await assignmentsService.createTeacherAssignment(
        user.id,
        user.name,
        input,
        attachments
      );

      return res.status(201).json({
        success: true,
        message:
          slots.length === 1
            ? "Assignment created"
            : `Assignment created for ${slots.length} classes`,
        data: slots,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.createAssignment error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create assignment";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * Get teacher's assignments (tab-based)
   * GET /app/assignments/teacher?tab=active|drafts|graded&batchId=&page=&limit=
   */
  async getTeacherAssignments(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const tab = req.query.tab as "active" | "drafts" | "graded" | undefined;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 50);

      const result = await assignmentsService.getTeacherAssignments(user.id, {
        tab,
        batchId,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result.assignments,
        pagination: result.pagination,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getTeacherAssignments error:", error);
      return res.status(500).json({ success: false, message: "Failed to get assignments" });
    }
  }

  /**
   * Update assignment
   * PUT /app/assignments/teacher/:id
   */
  async updateAssignment(req: Request, res: Response) {
    try {
      const user = req.user;
      const slotId = Number(req.params.id);

      if (!user || user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      if (isNaN(slotId)) {
        return res.status(400).json({ success: false, message: "Invalid assignment ID" });
      }

      const input: UpdateAssignmentInput = req.body;

      const updated = await assignmentsService.updateTeacherAssignment(
        slotId,
        user.id,
        input
      );

      return res.status(200).json({
        success: true,
        message: "Assignment updated",
        data: updated,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.updateAssignment error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update assignment";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * Soft-delete assignment
   * DELETE /app/assignments/teacher/:id
   */
  async deleteAssignment(req: Request, res: Response) {
    try {
      const user = req.user;
      const slotId = Number(req.params.id);

      if (!user || user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      if (isNaN(slotId)) {
        return res.status(400).json({ success: false, message: "Invalid assignment ID" });
      }

      await assignmentsService.deleteTeacherAssignment(slotId, user.id, user.name);

      return res.status(200).json({
        success: true,
        message: "Assignment deleted",
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.deleteAssignment error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to delete assignment";
      return res.status(400).json({ success: false, message });
    }
  }

  /**
   * Get assignment review page (per-student SUBMITTED/LATE/MISSING)
   * GET /app/assignments/teacher/:id/review?status=submitted|not_submitted|late
   */
  async getAssignmentReviewPage(req: Request, res: Response) {
    try {
      const user = req.user;
      const slotId = Number(req.params.id);

      if (!user || user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      if (isNaN(slotId)) {
        return res.status(400).json({ success: false, message: "Invalid assignment ID" });
      }

      const statusFilter = req.query.status as string | undefined;
      const validFilters = ["submitted", "not_submitted", "late"];
      if (statusFilter && !validFilters.includes(statusFilter)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter. Use: submitted, not_submitted, late",
        });
      }

      const reviewPage = await assignmentsService.getAssignmentReviewPage(
        slotId,
        user.id,
        statusFilter
      );

      if (!reviewPage) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found or access denied",
        });
      }

      return res.status(200).json({
        success: true,
        data: reviewPage,
      });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getAssignmentReviewPage error:", error);
      return res.status(500).json({ success: false, message: "Failed to get review page" });
    }
  }

  /**
   * Teacher assignment quick stats
   * GET /app/assignments/teacher/stats
   */
  async getTeacherStats(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }
      const stats = await assignmentsService.getTeacherStats(user.id);
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      log("error", "app.assignments.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AssignmentsController.getTeacherStats error:", error);
      return res.status(500).json({ success: false, message: "Failed to get stats" });
    }
  }
}

export const assignmentsController = new AssignmentsController();
