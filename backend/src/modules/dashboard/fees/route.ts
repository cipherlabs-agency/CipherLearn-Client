import { Router } from "express";
import FeesController from "./controller";
import { isAdmin, isAuthenticated } from "../../auth/middleware";

const router = Router();
const controller = new FeesController();

// All routes require authentication
router.use(isAuthenticated);

// =====================
// FEE STRUCTURES (Admin only)
// =====================
router.post("/structures", isAdmin, controller.createFeeStructure.bind(controller));
router.get("/structures/batch/:batchId", isAdmin, controller.getFeeStructuresByBatch.bind(controller));
router.put("/structures/:id", isAdmin, controller.updateFeeStructure.bind(controller));
router.delete("/structures/:id", isAdmin, controller.deleteFeeStructure.bind(controller));

// =====================
// FEE RECEIPTS (Admin only)
// =====================
router.post("/receipts", isAdmin, controller.createReceipt.bind(controller));
router.post("/receipts/bulk", isAdmin, controller.bulkCreateReceipts.bind(controller));
router.get("/receipts", isAdmin, controller.getReceipts.bind(controller));
router.get("/receipts/summary", isAdmin, controller.getReceiptsSummary.bind(controller));
router.get("/receipts/:id", isAdmin, controller.getReceiptById.bind(controller));
router.get("/receipts/:id/pdf", isAdmin, controller.downloadReceiptPDF.bind(controller));
router.put("/receipts/:id", isAdmin, controller.updateReceipt.bind(controller));
router.delete("/receipts/:id", isAdmin, controller.deleteReceipt.bind(controller));

// =====================
// STUDENT FEES SUMMARY (Admin only)
// =====================
router.get("/student/:studentId/summary", isAdmin, controller.getStudentFeesSummary.bind(controller));

// =====================
// STUDENT-FACING ENDPOINTS (Authenticated students)
// =====================
router.get("/my-receipts", controller.getMyReceipts.bind(controller));
router.get("/my-summary", controller.getMySummary.bind(controller));

export default router;
