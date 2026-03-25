import { Router } from "express";
import FeesController from "./controller";
import { isAdmin, isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";
import { validateQuery } from "../../auth/validations.auth";
import { feeReceiptFiltersSchema } from "./validation";

const router = Router();
const controller = new FeesController();

// All routes require authentication
router.use(isAuthenticated);

// =====================
// FEE STRUCTURES (Admin/Teacher)
// =====================
router.post("/structures", isAdminOrTeacher, controller.createFeeStructure.bind(controller));
router.get("/structures/batch/:batchId", isAdminOrTeacher, controller.getFeeStructuresByBatch.bind(controller));
router.put("/structures/:id", isAdminOrTeacher, controller.updateFeeStructure.bind(controller));
router.delete("/structures/:id", isAdminOrTeacher, controller.deleteFeeStructure.bind(controller));

// =====================
// FEE RECEIPTS (Admin/Teacher)
// =====================
router.post("/receipts", isAdminOrTeacher, controller.createReceipt.bind(controller));
router.post("/receipts/bulk", isAdminOrTeacher, controller.bulkCreateReceipts.bind(controller));
router.get("/receipts", isAdminOrTeacher, validateQuery(feeReceiptFiltersSchema), controller.getReceipts.bind(controller));
router.get("/receipts/summary", isAdminOrTeacher, controller.getReceiptsSummary.bind(controller));
router.get("/receipts/:id", isAdminOrTeacher, controller.getReceiptById.bind(controller));
router.get("/receipts/:id/pdf", isAdminOrTeacher, controller.downloadReceiptPDF.bind(controller));
router.put("/receipts/:id", isAdminOrTeacher, controller.updateReceipt.bind(controller));
router.delete("/receipts/:id", isAdminOrTeacher, controller.deleteReceipt.bind(controller));

// =====================
// STUDENT FEES SUMMARY (Admin/Teacher)
// =====================
router.get("/student/:studentId/summary", isAdminOrTeacher, controller.getStudentFeesSummary.bind(controller));

// =====================
// STUDENT-FACING ENDPOINTS (Authenticated students)
// =====================
router.get("/my-receipts", controller.getMyReceipts.bind(controller));
router.get("/my-summary", controller.getMySummary.bind(controller));

export default router;
