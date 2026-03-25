import { Router } from "express";
import CRMController from "./controller";
import { isAuthenticated, isAdmin } from "../../auth/middleware";

const router = Router();
const controller = new CRMController();

/**
 * @route   POST /api/v1/dashboard/crm/public/leads
 * @desc    Public endpoint for lead capture from landing pages
 * @access  Public
 */
router.post("/public/leads", controller.createLead.bind(controller));

/**
 * @route   GET /api/v1/dashboard/crm/leads
 * @desc    Get all leads for admin dashboard
 * @access  Admin only
 */
router.get("/leads", isAuthenticated, isAdmin, controller.getAllLeads.bind(controller));

export default router;
