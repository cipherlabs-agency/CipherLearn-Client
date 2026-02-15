import { Router } from "express";
import AppLectureController from "./controller";

const router = Router();
const controller = new AppLectureController();

// Get my schedule (Teacher: assigned lectures, Student: batch lectures)
router.get("/my-schedule", controller.getMySchedule.bind(controller));

// Get lecture detail
router.get("/:id", controller.getLectureById.bind(controller));

// Teacher adds post-lecture notes
router.put("/:id/notes", controller.addNotes.bind(controller));

// Teacher marks lecture as completed
router.put("/:id/complete", controller.markComplete.bind(controller));

export default router;
