import { Router } from "express";
import { instagramController } from "./controller";
import { isAdminOrTeacher, isAuthenticated } from "../../auth/middleware";

const router = Router();

// ─── Webhook endpoints (called by Meta — NO auth) ─────
router.get(
    "/webhook",
    instagramController.webhookVerify.bind(instagramController)
);
router.post(
    "/webhook",
    instagramController.webhookHandler.bind(instagramController)
);
// DEV ONLY — simulate a comment webhook to test DM sending
router.post(
    "/webhook/test",
    isAdminOrTeacher,
    instagramController.webhookTest.bind(instagramController)
);

// ─── OAuth endpoints ──────────────────────────────────
// /connect requires auth (to get user ID for state param)
// /callback is PUBLIC — Instagram redirects the user here directly (no JWT)
//   User ID comes from the `state` query parameter instead
router.get(
    "/connect",
    isAdminOrTeacher,
    instagramController.connect.bind(instagramController)
);
router.get(
    "/callback",
    instagramController.callback.bind(instagramController)
);

// ─── Account management ──────────────────────────────
router.get(
    "/account",
    isAdminOrTeacher,
    instagramController.getAccount.bind(instagramController)
);
router.post(
    "/disconnect",
    isAdminOrTeacher,
    instagramController.disconnect.bind(instagramController)
);

// ─── Media ────────────────────────────────────────────
router.get(
    "/media",
    isAdminOrTeacher,
    instagramController.getMedia.bind(instagramController)
);

// ─── Automation Rules CRUD ────────────────────────────
router.get(
    "/rules",
    isAdminOrTeacher,
    instagramController.getRules.bind(instagramController)
);
router.post(
    "/rules",
    isAdminOrTeacher,
    instagramController.createRule.bind(instagramController)
);
router.put(
    "/rules/:id",
    isAdminOrTeacher,
    instagramController.updateRule.bind(instagramController)
);
router.delete(
    "/rules/:id",
    isAdminOrTeacher,
    instagramController.deleteRule.bind(instagramController)
);

// ─── Rule Logs ────────────────────────────────────────
router.get(
    "/rules/:id/logs",
    isAdminOrTeacher,
    instagramController.getRuleLogs.bind(instagramController)
);

export default router;
