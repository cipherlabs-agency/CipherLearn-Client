import { Router } from "express";
import AppLectureController from "./controller";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";

const router = Router();
const controller = new AppLectureController();

// Get my schedule (Teacher: assigned lectures, Student: batch lectures)
router.get("/my-schedule", appReadRateLimiter, controller.getMySchedule.bind(controller));

// Get lecture detail
router.get("/:id", appReadRateLimiter, controller.getLectureById.bind(controller));

// Teacher adds post-lecture notes
router.put("/:id/notes", controller.addNotes.bind(controller));

// Teacher marks lecture as completed
router.put("/:id/complete", controller.markComplete.bind(controller));

export default router;
