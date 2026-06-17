import { Router } from "express";
import CRMController from "./controller";
import { isAuthenticated, isAdmin } from "../../auth/middleware";
import { validate } from "../../../middleware/validate";
import { CRMValidations } from "./validation";

const router = Router();
const controller = new CRMController();

/**
 * @route   POST /api/v1/dashboard/crm/public/leads
 * @desc    Public endpoint for lead capture from landing pages
 * @access  Public
 */
router.post("/public/leads", validate(CRMValidations.createLead), controller.createLead.bind(controller));

/**
 * @route   GET /api/v1/dashboard/crm/leads
 * @desc    Get all leads for admin dashboard
 * @access  Admin only
 */
router.get(
  "/leads",
  isAuthenticated,
  isAdmin,
  validate(CRMValidations.getAllLeadsQuery, "query"),
  controller.getAllLeads.bind(controller),
);

export default router;
