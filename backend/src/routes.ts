import { Router } from "express";
import authRoutes from "./modules/auth/routes.auth";
import dashboardRoutes from "./modules/dashboard/routes";
import appRoutes from "./modules/app/route";
import studentAuthRoutes from "./modules/app/auth/route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);

// Student app auth routes (public - before protected app routes)
router.use("/app/auth", studentAuthRoutes);

// Protected student app routes
router.use("/app", appRoutes);

export default router;
