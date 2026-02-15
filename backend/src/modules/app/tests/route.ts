import { Router } from "express";
import { isAppUser, isStudent } from "../../auth/middleware";
import AppTestController from "./controller";

const router = Router();
const controller = new AppTestController();

// Student: get my tests (with optional filter: upcoming, complete, results)
router.get("/", isAppUser, controller.getTests.bind(controller));

// Student: performance analytics
router.get("/performance", isStudent, controller.getPerformance.bind(controller));

// Teacher: view batch tests
router.get("/batch/:batchId", isAppUser, controller.getBatchTests.bind(controller));

// Get test detail (Student gets their score, Teacher gets test info)
router.get("/:id", isAppUser, controller.getTestDetail.bind(controller));

// Teacher: view all scores for a test
router.get("/:id/scores", isAppUser, controller.getTestScores.bind(controller));

export default router;
