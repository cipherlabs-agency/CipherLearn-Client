import { Router } from "express";
import { isAdmin, isAuthenticated } from "../../auth/middleware";
import MaintenanceController from "./controller";

const router = Router();
const controller = new MaintenanceController();

router.use(isAuthenticated, isAdmin);

router.post("/auth", controller.authenticate.bind(controller));
router.get("/status", controller.getStatus.bind(controller));
router.get("/seed-data", controller.getSeedData.bind(controller));
router.post("/seed", controller.seed.bind(controller));
router.delete("/cleanup", controller.cleanup.bind(controller));
router.post("/api-health", controller.apiHealth.bind(controller));
router.post("/validation-audit", controller.validationAudit.bind(controller));
router.post("/security-audit", controller.securityAudit.bind(controller));
router.get("/db-integrity", controller.dbIntegrity.bind(controller));
router.post("/load-test", controller.loadTest.bind(controller));
router.post("/playground", controller.playground.bind(controller));
router.get("/endpoints", controller.getEndpoints.bind(controller));
router.post("/test-notification", controller.testNotification.bind(controller));

export default router;
