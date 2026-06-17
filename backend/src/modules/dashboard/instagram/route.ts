import { Router } from "express";
import { instagramController } from "./controller";
import { isAdminOrTeacher } from "../../auth/middleware";
import { validate } from "../../../middleware/validate";
import { InstagramValidations } from "./validation";

const router = Router();

// ─── Webhook endpoints (called by Meta — NO auth, NO validation) ──────────────
router.get("/webhook", instagramController.webhookVerify.bind(instagramController));
router.post("/webhook", instagramController.webhookHandler.bind(instagramController));

// DEV ONLY — simulate a comment webhook
router.post(
  "/webhook/test",
  isAdminOrTeacher,
  validate(InstagramValidations.webhookTestBody),
  instagramController.webhookTest.bind(instagramController),
);

// ─── OAuth ────────────────────────────────────────────────────────────────────
router.get("/connect", isAdminOrTeacher, instagramController.connect.bind(instagramController));
// /callback is PUBLIC — Instagram redirects here directly (no JWT in request)
router.get("/callback", instagramController.callback.bind(instagramController));

// ─── Account management ───────────────────────────────────────────────────────
router.get("/account", isAdminOrTeacher, instagramController.getAccount.bind(instagramController));
router.post("/disconnect", isAdminOrTeacher, instagramController.disconnect.bind(instagramController));

// ─── Media ────────────────────────────────────────────────────────────────────
router.get("/media", isAdminOrTeacher, instagramController.getMedia.bind(instagramController));

// ─── Automation Rules CRUD ────────────────────────────────────────────────────
router.get("/rules", isAdminOrTeacher, instagramController.getRules.bind(instagramController));

router.post(
  "/rules",
  isAdminOrTeacher,
  validate(InstagramValidations.createRule),
  instagramController.createRule.bind(instagramController),
);

router.put(
  "/rules/:id",
  isAdminOrTeacher,
  validate(InstagramValidations.ruleIdParam, "params"),
  validate(InstagramValidations.updateRule),
  instagramController.updateRule.bind(instagramController),
);

router.delete(
  "/rules/:id",
  isAdminOrTeacher,
  validate(InstagramValidations.ruleIdParam, "params"),
  instagramController.deleteRule.bind(instagramController),
);

// ─── Rule Logs ────────────────────────────────────────────────────────────────
router.get(
  "/rules/:id/logs",
  isAdminOrTeacher,
  validate(InstagramValidations.ruleIdParam, "params"),
  validate(InstagramValidations.ruleLogsQuery, "query"),
  instagramController.getRuleLogs.bind(instagramController),
);

// ─── Analytics & Global Logs ──────────────────────────────────────────────────
router.get("/analytics", isAdminOrTeacher, instagramController.getAnalytics.bind(instagramController));

router.get(
  "/logs",
  isAdminOrTeacher,
  validate(InstagramValidations.getLogsQuery, "query"),
  instagramController.getAllLogs.bind(instagramController),
);

export default router;
