import { Router } from "express";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import MaintenanceController from "./controller";

const router = Router();
const controller = new MaintenanceController();

// All maintenance routes require admin authentication
router.use(isAuthenticated, isAdmin);

router.post("/auth", controller.authenticate.bind(controller));
router.post("/seed", controller.seed.bind(controller));
router.get("/status", controller.getStatus.bind(controller));
router.delete("/cleanup", controller.cleanup.bind(controller));

export default router;
