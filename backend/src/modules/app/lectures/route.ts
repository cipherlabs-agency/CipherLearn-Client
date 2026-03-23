import { Router } from "express";
import AppLectureController from "./controller";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";
import { isTeacher } from "../../auth/middleware";
import { lectureAttachmentUpload } from "../../../config/multer.config";

const router = Router();
const controller = new AppLectureController();

// ==================== TEACHER CRUD (before /:id wildcard) ====================

/**
 * POST /app/lectures/teacher
 * Teacher: schedule a new lecture
 * Body: { title, subject, batchId, date, startTime, endTime, room?, description?,
 *         isOnline?, meetingLink?, notifyStudents? }
 */
router.post("/teacher", isTeacher, lectureAttachmentUpload.array("attachments", 5), controller.createLecture.bind(controller));

/**
 * PUT /app/lectures/teacher/:id
 * Teacher: update a lecture they own
 */
router.put("/teacher/:id", isTeacher, lectureAttachmentUpload.array("attachments", 5), controller.updateLecture.bind(controller));

/**
 * DELETE /app/lectures/teacher/:id
 * Teacher: soft-delete a lecture they own
 */
router.delete("/teacher/:id", isTeacher, controller.deleteLecture.bind(controller));

// ==================== SHARED ROUTES ====================

// Get my schedule (Teacher: assigned lectures, Student: batch lectures)
router.get("/my-schedule", appReadRateLimiter, controller.getMySchedule.bind(controller));

// Get lecture detail
router.get("/:id", appReadRateLimiter, controller.getLectureById.bind(controller));

// Teacher adds post-lecture notes
router.put("/:id/notes", controller.addNotes.bind(controller));

// Teacher marks lecture as completed
router.put("/:id/complete", controller.markComplete.bind(controller));

export default router;
