import type { Request, Response } from "express";
import { assignmentsService } from "./service";
import logger from "../../../utils/logger";
import { UserRoles } from "../../../../prisma/generated/prisma/enums";
import type { CreateSubmissionInput, ReviewSubmissionInput, SubmissionFile } from "./types";

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

        const assignments = await assignmentsService.getStudentAssignments(
          student.id,
          student.batchId
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

      // Process uploaded files
      const files = req.files as Express.Multer.File[] | undefined;
      const submissionFiles: SubmissionFile[] =
        files?.map((file) => ({
          url: `/uploads/submissions/${file.filename}`,
          originalFilename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        })) || [];

      if (submissionFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one file is required",
        });
      }

      const data: CreateSubmissionInput = {
        slotId,
        files: submissionFiles,
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
      logger.error("AssignmentsController.reviewSubmission error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to review submission: ${error}`,
      });
    }
  }
}

export const assignmentsController = new AssignmentsController();
