import { Router } from "express";
import { isAdmin } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { appSettingsAdminController } from "./controller";

/**
 * /api/app/admin/settings — ADMIN-only class settings + teacher permissions.
 * Register in app/route.ts:  router.use("/admin/settings", settingsAdminRoutes);
 */
const router = Router();

router.use(isAdmin);

router.get("/", appReadRateLimiter, appSettingsAdminController.getSettings.bind(appSettingsAdminController));
router.put("/", appWriteRateLimiter, appSettingsAdminController.updateSettings.bind(appSettingsAdminController));
router.put("/teacher-permissions", appWriteRateLimiter, appSettingsAdminController.updateTeacherPermissions.bind(appSettingsAdminController));
router.post("/teacher-permissions/reset", appWriteRateLimiter, appSettingsAdminController.resetTeacherPermissions.bind(appSettingsAdminController));

export default router;
