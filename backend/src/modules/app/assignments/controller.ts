import type { Request, Response } from "express";
import { assignmentsService } from "./service";
import logger from "../../../utils/logger";

class AssignmentsController {
  /**
   * Get upcoming assignments
   * GET /app/assignments
   */
  async getAssignments(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(401).json({
          success: false,
          message: "Student not authenticated",
        });
      }

      const assignments = await assignmentsService.getUpcomingAssignments(
        student.id,
        student.batchId
      );

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      logger.error("AssignmentsController.getAssignments error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to get assignments: ${error}`,
      });
    }
  }
}

export const assignmentsController = new AssignmentsController();
