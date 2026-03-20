import type { Request, Response } from "express";
import TestService from "./service";
import logger from "../../../utils/logger";
import { CreateTestInput, UpdateTestInput, UploadScoreInput, GetTestsQuery } from "./types";
import { TestStatus, TestType, ScoreStatus } from "../../../../prisma/generated/prisma/enums";
import { log } from "../../../utils/logtail";

const testService = new TestService();

export default class TestController {
  public async create(req: Request, res: Response) {
    try {
      const data: CreateTestInput = req.body;
      const userId = req.user!.id;

      const test = await testService.create(data, userId);

      logger.info(`Test created: "${test.title}" by ${req.user!.name}`);

      return res.status(201).json({
        success: true,
        message: "Test created successfully",
        data: test,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.create error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("cannot exceed")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to create test: ${error.message}`,
      });
    }
  }

  public async getAll(req: Request, res: Response) {
    try {
      const query: GetTestsQuery = {
        batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
        subject: req.query.subject as string | undefined,
        status: req.query.status as TestStatus | undefined,
        testType: req.query.testType as TestType | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await testService.getAll(query);

      return res.status(200).json({
        success: true,
        data: result.tests,
        pagination: result.pagination,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TestController.getAll error:", error);
      return res.status(500).json({
        success: false,
        message: `Failed to fetch tests: ${error.message}`,
      });
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const test = await testService.getById(Number(req.params.id));

      return res.status(200).json({
        success: true,
        data: test,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TestController.getById error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch test: ${error.message}`,
      });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const data: UpdateTestInput = req.body;
      const test = await testService.update(Number(req.params.id), data);

      logger.info(`Test updated: "${test.title}" by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: "Test updated successfully",
        data: test,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.update error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("cannot exceed")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update test: ${error.message}`,
      });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      await testService.delete(Number(req.params.id));

      logger.info(`Test deleted: ID ${req.params.id} by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: "Test deleted successfully",
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.delete error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to delete test: ${error.message}`,
      });
    }
  }

  public async publish(req: Request, res: Response) {
    try {
      const test = await testService.publish(Number(req.params.id));

      logger.info(`Test published: "${test.title}" by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: "Test scores published and visible to students",
        data: test,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.publish error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to publish test: ${error.message}`,
      });
    }
  }

  public async uploadScore(req: Request, res: Response) {
    try {
      const data: UploadScoreInput = req.body;
      const userId = req.user!.id;

      const score = await testService.uploadScore(Number(req.params.id), data, userId);

      logger.info(`Score uploaded: Test ${req.params.id}, Student ${data.studentId} by ${req.user!.name}`);

      return res.status(201).json({
        success: true,
        message: "Score uploaded successfully",
        data: score,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.uploadScore error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("already exists") || error.message.includes("cannot exceed")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to upload score: ${error.message}`,
      });
    }
  }

  public async uploadScoresBulk(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: "CSV file is required" });
      }

      const csvContent = file.buffer.toString("utf-8");
      const lines = csvContent.split("\n").filter((l) => l.trim());

      if (lines.length < 2) {
        return res.status(400).json({ success: false, message: "CSV file must have a header row and at least one data row" });
      }

      // Parse CSV: studentId,marksObtained,remarks
      const rows: Array<{ studentId: number; marksObtained: number; remarks?: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length < 2) continue;

        const studentId = parseInt(cols[0], 10);
        const marksObtained = parseFloat(cols[1]);

        if (isNaN(studentId) || isNaN(marksObtained)) continue;

        rows.push({
          studentId,
          marksObtained,
          remarks: cols[2] || undefined,
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: "No valid rows found in CSV" });
      }

      const result = await testService.uploadScoresBulk(Number(req.params.id), rows, req.user!.id);

      logger.info(`Bulk scores uploaded: Test ${req.params.id}, ${result.uploaded} scores by ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: `${result.uploaded} scores uploaded, ${result.absent} absent, ${result.failed} failed`,
        data: result,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.uploadScoresBulk error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to upload scores: ${error.message}`,
      });
    }
  }

  public async updateScore(req: Request, res: Response) {
    try {
      const { marksObtained, remarks, status } = req.body;

      const score = await testService.updateScore(
        Number(req.params.id),
        Number(req.params.scoreId),
        { marksObtained, remarks, status: status as ScoreStatus | undefined },
        req.user!.id
      );

      return res.status(200).json({
        success: true,
        message: "Score updated successfully",
        data: score,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error), userId: req.user?.id });
      logger.error("TestController.updateScore error:", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("cannot exceed")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to update score: ${error.message}`,
      });
    }
  }

  public async getStats(req: Request, res: Response) {
    try {
      const stats = await testService.getStats(Number(req.params.id));

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      log("error", "dashboard.tests.status failed", { err: error instanceof Error ? error.message : String(error) });
      logger.error("TestController.getStats error:", error);

      if (error.message === "Test not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({
        success: false,
        message: `Failed to fetch test stats: ${error.message}`,
      });
    }
  }
}
