import { Router } from "express";
import { isAppUser, isAdmin } from "../../auth/middleware";
import { appReadRateLimiter, appWriteRateLimiter } from "../../../middleware/rateLimiter";
import { appNotificationsExtController } from "./controller";

/**
 * Additional notification routes, mounted ALSO at /api/app/notifications
 * (alongside the existing notifications module). Paths do not collide.
 * Register in app/route.ts AFTER the existing notifications mount:
 *   router.use("/notifications", notificationsExtRoutes);
 */
const router = Router();

router.get(
  "/unread-count",
  isAppUser,
  appReadRateLimiter,
  appNotificationsExtController.getUnreadCount.bind(appNotificationsExtController)
);

router.post(
  "/broadcast",
  isAdmin,
  appWriteRateLimiter,
  appNotificationsExtController.broadcast.bind(appNotificationsExtController)
);

export default router;
