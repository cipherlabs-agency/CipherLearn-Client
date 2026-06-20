import { Router } from "express";
import { isAdmin } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { appDataRecoveryController } from "./controller";

/**
 * /api/app/admin/recovery — ADMIN soft-delete recovery for students & batches.
 * Register in app/route.ts:  router.use("/admin/recovery", dataRecoveryRoutes);
 */
const router = Router();

router.use(isAdmin);

// Students
router.get("/students", appReadRateLimiter, appDataRecoveryController.listDeletedStudents.bind(appDataRecoveryController));
router.put("/students/restore", appWriteRateLimiter, appDataRecoveryController.restoreStudents.bind(appDataRecoveryController));
router.delete("/students/:id", appWriteRateLimiter, appDataRecoveryController.hardDeleteStudent.bind(appDataRecoveryController));

// Batches
router.get("/batches", appReadRateLimiter, appDataRecoveryController.listDeletedBatches.bind(appDataRecoveryController));
router.put("/batches/restore", appWriteRateLimiter, appDataRecoveryController.restoreBatches.bind(appDataRecoveryController));
router.delete("/batches/:id", appWriteRateLimiter, appDataRecoveryController.hardDeleteBatch.bind(appDataRecoveryController));

export default router;
