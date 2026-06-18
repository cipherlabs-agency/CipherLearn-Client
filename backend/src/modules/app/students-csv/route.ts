import { Router } from "express";
import { isAdmin } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import upload from "../../../config/multer.config";
import { appStudentsCsvController } from "./controller";

/**
 * /api/app/admin/students-csv — ADMIN bulk student enrollment via CSV.
 * Register in app/route.ts:  router.use("/admin/students-csv", studentsCsvRoutes);
 * (Distinct path so it does not collide with /admin/students/:id.)
 */
const router = Router();

router.use(isAdmin);

router.get("/template", appReadRateLimiter, appStudentsCsvController.downloadTemplate.bind(appStudentsCsvController));
router.post("/preview", appWriteRateLimiter, upload.single("file"), appStudentsCsvController.preview.bind(appStudentsCsvController));
router.post("/import", appWriteRateLimiter, upload.single("file"), appStudentsCsvController.import.bind(appStudentsCsvController));

export default router;
