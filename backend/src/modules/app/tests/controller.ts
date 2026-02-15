import type { Request, Response } from "express";
import AppTestService from "./service";
import logger from "../../../utils/logger";
import { UserRoles } from "../../../../prisma/generated/prisma/enums";

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
}
