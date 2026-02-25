import { Router, Request, Response, NextFunction } from "express";
import { settingsController } from "./controller";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import { updateSettingsSchema } from "./validation";

const router = Router();

// GET /api/dashboard/settings — any authenticated user can read settings
router.get(
  "/",
  isAuthenticated,
  settingsController.getSettings.bind(settingsController)
);

// PUT /api/dashboard/settings — admin only
router.put(
  "/",
  isAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = updateSettingsSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({ success: false, message: error.details.map((d) => d.message).join(", ") });
      return;
    }
    next();
  },
  settingsController.updateSettings.bind(settingsController)
);

// POST /api/dashboard/settings/reset-teacher-permissions — admin only
router.post(
  "/reset-teacher-permissions",
  isAdmin,
  settingsController.resetTeacherPermissions.bind(settingsController)
);

export default router;
