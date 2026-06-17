import { Router } from "express";
import { isAuthenticated } from "../../auth/middleware";
import { notificationController } from "./controller";
import { validate } from "../../../middleware/validate";
import { NotificationValidations } from "./validation";

const router = Router();

/**
 * GET /dashboard/notifications/stream
 * SSE endpoint — must be BEFORE /:id routes to avoid param conflict.
 * Auth: token passed as ?token=<jwt> query param (EventSource doesn't support headers).
 */
router.get("/stream", isAuthenticated, notificationController.stream);

/** GET /dashboard/notifications */
router.get(
  "/",
  isAuthenticated,
  validate(NotificationValidations.getNotificationsQuery, "query"),
  notificationController.getNotifications,
);

/** GET /dashboard/notifications/unread-count */
router.get("/unread-count", isAuthenticated, notificationController.getUnreadCount);

/** PATCH /dashboard/notifications/:id/read */
router.patch(
  "/:id/read",
  isAuthenticated,
  validate(NotificationValidations.markAsReadParams, "params"),
  notificationController.markAsRead,
);

/** POST /dashboard/notifications/mark-all-read */
router.post("/mark-all-read", isAuthenticated, notificationController.markAllAsRead);

export default router;
