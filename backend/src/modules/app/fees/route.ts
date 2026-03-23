import { Router } from "express";
import { feesController } from "./controller";
import { isStudent, isTeacher } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { validate } from "../../../middleware/validate";
import { FeesValidations } from "./validation";

const router = Router();

// ==================== TEACHER ROUTES ====================

/**
 * GET /app/fees/teacher/students
 * Teacher: list students in their batches with fee status
 */
router.get("/teacher/students", isTeacher, appReadRateLimiter, feesController.getTeacherStudents.bind(feesController));

/**
 * GET /app/fees/teacher/students/:studentId
 * Teacher: get full fee detail for a student
 */
router.get("/teacher/students/:studentId", isTeacher, appReadRateLimiter, feesController.getStudentFeeDetail.bind(feesController));

/**
 * POST /app/fees/teacher/receipts/:receiptId/payment
 * Teacher: record a payment for a fee receipt
 * Body: { paidAmount, paymentMode, transactionId?, chequeNumber?, notes? }
 */
router.post("/teacher/receipts/:receiptId/payment", isTeacher, appWriteRateLimiter, validate(FeesValidations.recordPayment), feesController.recordPayment.bind(feesController));

/**
 * POST /app/fees/teacher/students/:studentId/reminder
 * Teacher: send a fee reminder push notification to a student
 */
router.post("/teacher/students/:studentId/reminder", isTeacher, feesController.sendFeeReminder.bind(feesController));

// ==================== STUDENT ROUTES ====================

router.get("/receipts", isStudent, appReadRateLimiter, validate(FeesValidations.receiptsQuery, "query"), feesController.getFeeReceipts.bind(feesController));
router.get("/receipts/:id/pdf", isStudent, feesController.getReceiptPdf.bind(feesController));
router.get("/summary", isStudent, feesController.getFeesSummary.bind(feesController));
router.get("/structures", isStudent, feesController.getFeeStructures.bind(feesController));

export default router;
