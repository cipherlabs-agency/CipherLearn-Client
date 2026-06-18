import { Router } from "express";
import { isTeacher, isAdmin, requireTeacherPermission } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { appFeeReceiptsController } from "./controller";

/**
 * Additional fee-receipt management routes, mounted ALSO at /api/app/fees
 * (alongside the existing fees module). Paths here do not collide with the
 * existing fees routes. Teacher access gated by `canViewFees`; admin passes.
 *
 * Register in app/route.ts AFTER the existing fees mount:
 *   router.use("/fees", feeReceiptsRoutes);
 */
const router = Router();

// Specific routes first to avoid the :id param catching "bulk"/"summary"
router.post(
  "/teacher/receipts/bulk",
  isAdmin,
  appWriteRateLimiter,
  appFeeReceiptsController.bulkCreateReceipts.bind(appFeeReceiptsController)
);

router.get(
  "/teacher/receipts-summary",
  isTeacher,
  requireTeacherPermission("canViewFees"),
  appReadRateLimiter,
  appFeeReceiptsController.getReceiptsSummary.bind(appFeeReceiptsController)
);

router.post(
  "/teacher/receipts",
  isTeacher,
  requireTeacherPermission("canViewFees"),
  appWriteRateLimiter,
  appFeeReceiptsController.createReceipt.bind(appFeeReceiptsController)
);

router.put(
  "/teacher/receipts/:id",
  isTeacher,
  requireTeacherPermission("canViewFees"),
  appWriteRateLimiter,
  appFeeReceiptsController.updateReceipt.bind(appFeeReceiptsController)
);

router.delete(
  "/teacher/receipts/:id",
  isAdmin,
  appWriteRateLimiter,
  appFeeReceiptsController.deleteReceipt.bind(appFeeReceiptsController)
);

export default router;
