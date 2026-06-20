import { Router } from "express";
import { isAdmin } from "../../auth/middleware";
import { appReadRateLimiter } from "../../../middleware/rateLimiter";
import { appLeadsController } from "./controller";

/**
 * /api/app/admin/leads — ADMIN view of CRM leads.
 * Register in app/route.ts:  router.use("/admin/leads", leadsRoutes);
 *
 * NOTE: lead status update is not exposed yet — the dashboard CRMService has
 * no updateLeadStatus method. Add one there first, then a PUT here.
 */
const router = Router();

router.use(isAdmin);
router.get("/", appReadRateLimiter, appLeadsController.listLeads.bind(appLeadsController));

export default router;
