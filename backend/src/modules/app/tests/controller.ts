import type { Request, Response } from "express";
import AppTestService from "./service";
import logger from "../../../utils/logger";
import { TestStatus, UserRoles } from "../../../../prisma/generated/prisma/enums";
import type { BulkSaveScoreInput } from "./types";
import { log } from "../../../utils/logtail";

const testService = new AppTestService();

export default class AppTestController {
  public async getTests(req: Request, res: Response) {
    try {
      const user = req.user!;
      const filter = req.query.filter as string | undefined;

      if (user.role === UserRoles.STUDENT) {
        const student = req.student;
        if (!student?.batchId) {
          return res.status(400).json({ success: false, message: "Student is not assigned to any batch" });
        }
        const tests = await testService.getStudentTests(student.id, student.batchId, filter);
        return res.status(200).json({ success: true, data: tests });
      }

      return res.status(403).json({ success: false, message: "Use /batch/:batchId for teacher access" });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getTests error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch tests: ${error.message}`,
      });
    }
  }

  public async getTestDetail(req: Request, res: Response) {
    try {
      const user = req.user!;

      if (user.role === UserRoles.STUDENT) {
        const student = req.student;
        if (!student) {
          return res.status(400).json({ success: false, message: "Student profile not found" });
        }
        const test = await testService.getTestDetail(Number(req.params.id), student.id);
        return res.status(200).json({ success: true, data: test });
      }

      // For teacher, return test without score
      const test = await testService.getTestDetail(Number(req.params.id), -1);
      return res.status(200).json({ success: true, data: test });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getTestDetail error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch test: ${error.message}`,
      });
    }
  }

  public async getPerformance(req: Request, res: Response) {
    try {
      const student = req.student;
      if (!student) {
        return res.status(400).json({ success: false, message: "Student profile not found" });
      }

      const performance = await testService.getStudentPerformance(student.id);

      return res.status(200).json({ success: true, data: performance });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("AppTestController.getPerformance error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch performance: ${error.message}`,
      });
    }
  }

  public async getBatchTests(req: Request, res: Response) {
    try {
      const user = req.user!;
      if (user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Only teachers can view batch tests" });
      }

      const tests = await testService.getTeacherBatchTests(Number(req.params.batchId));

      return res.status(200).json({ success: true, data: tests });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getBatchTests error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch batch tests: ${error.message}`,
      });
    }
  }

  public async getTestScores(req: Request, res: Response) {
    try {
      const user = req.user!;
      if (user.role !== UserRoles.TEACHER) {
        return res.status(403).json({ success: false, message: "Only teachers can view all scores" });
      }

      const result = await testService.getTeacherTestScores(Number(req.params.id));

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getTestScores error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch test scores: ${error.message}`,
      });
    }
  }

  // ==================== TEACHER (NEW) ENDPOINTS ====================

  /**
   * GET /app/tests/teacher
   * Teacher: list their tests with grading status
   *   ?batchId=&subject=&status=&page=&limit=
   */
  public async getTeacherTests(req: Request, res: Response) {
    try {
      const user = req.user!;
      const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
      const subject = req.query.subject as string | undefined;
      const status = req.query.status as TestStatus | undefined;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = Math.min(req.query.limit ? Number(req.query.limit) : 20, 50);

      const result = await testService.getTeacherTests(user.id, {
        batchId,
        subject,
        status,
        page,
        limit,
      });

      return res.status(200).json({
        success: true,
        data: result.tests,
        pagination: result.pagination,
      });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getTeacherTests error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch tests: ${error.message}`,
      });
    }
  }

  /**
   * GET /app/tests/teacher/:id/score-sheet
   * Teacher: get test with all student score slots (null = ungraded)
   */
  public async getScoreSheet(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);

      if (isNaN(testId)) {
        return res.status(400).json({ success: false, message: "Invalid test ID" });
      }

      const result = await testService.getScoreSheet(testId, user.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getScoreSheet error:", error);
      const status = error.message.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /app/tests/teacher/:id/scores
   * Teacher: bulk save scores
   * Body: { scores: [{ studentId, marksObtained, remarks? }] }
   */
  public async bulkSaveScores(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);

      if (isNaN(testId)) {
        return res.status(400).json({ success: false, message: "Invalid test ID" });
      }

      const { scores } = req.body as { scores: BulkSaveScoreInput[] };

      if (!Array.isArray(scores) || scores.length === 0) {
        return res.status(400).json({
          success: false,
          message: "scores must be a non-empty array",
        });
      }

      const result = await testService.bulkSaveScores(testId, user.id, scores);

      return res.status(200).json({
        success: true,
        message: `Scores saved for ${result.saved} students`,
        data: result,
      });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.bulkSaveScores error:", error);
      const status = error.message.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /app/tests/teacher/:id/publish
   * Teacher: publish results (locks scores, notifies students)
   */
  public async publishResults(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);

      if (isNaN(testId)) {
        return res.status(400).json({ success: false, message: "Invalid test ID" });
      }

      const summary = await testService.publishTestResults(testId, user.id);

      // Notify students that results are published
      import("../../../config/db.config").then(async (m) => {
        const testDetails = await m.prisma.test.findUnique({ where: { id: testId } });
        if (testDetails) {
          require("../../../utils/pushNotifications")
            .sendToBatchStudents(
              testDetails.batchId,
              "resultPublished",
              `Results Published: ${summary.title}`,
              `Test results have been published for ${summary.subject}. Class average is ${summary.classAverage.toFixed(1)}.`,
              { type: "TEST_RESULT", testId }
            )
            .catch((e: Error) => logger.error("Failed to send test results push notification", e));
        }
      }).catch(e => logger.error("DB Fetch Failed", e));

      return res.status(200).json({
        success: true,
        message: "Results published successfully",
        data: summary,
      });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.publishResults error:", error);
      const status = error.message.includes("not found") ? 404 : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /app/tests/teacher/:id/summary
   * Teacher: class average, highest/lowest, distribution
   */
  public async getTestSummary(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);

      if (isNaN(testId)) {
        return res.status(400).json({ success: false, message: "Invalid test ID" });
      }

      const summary = await testService.getTestSummary(testId, user.id);
      return res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      log("error", "app.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.getTestSummary error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /app/tests/teacher/:id/export-csv
   * Teacher: download student scores as CSV
   */
  public async exportCsv(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);

      if (isNaN(testId)) {
        return res.status(400).json({ success: false, message: "Invalid test ID" });
      }

      const { csv, filename } = await testService.exportScoresCsv(testId, user.id);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (error: any) {
      log("error", "app.tests.send failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.exportCsv error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  // ==================== TEST REMINDERS ====================

  /**
   * POST /app/tests/:id/remind
   * Student: toggle reminder for a test
   */
  public async toggleReminder(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);
      if (isNaN(testId)) return res.status(400).json({ success: false, message: "Invalid test ID" });
      const result = await testService.toggleReminder(testId, user.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      log("error", "app.tests.remind failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.toggleReminder error:", error);
      return res.status(500).json({ success: false, message: "Failed to toggle reminder" });
    }
  }

  /**
   * DELETE /app/tests/:id/remind
   * Student: remove reminder for a test
   */
  public async removeReminder(req: Request, res: Response) {
    try {
      const user = req.user!;
      const testId = Number(req.params.id);
      if (isNaN(testId)) return res.status(400).json({ success: false, message: "Invalid test ID" });
      await testService.removeReminder(testId, user.id);
      return res.status(200).json({ success: true, message: "Reminder removed" });
    } catch (error: any) {
      log("error", "app.tests.remind failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("AppTestController.removeReminder error:", error);
      return res.status(500).json({ success: false, message: "Failed to remove reminder" });
    }
  }
}
