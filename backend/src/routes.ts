import { Router } from "express";
import authRoutes from "./modules/auth/routes.auth";
import dashboardRoutes from "./modules/dashboard/routes";
import appRoutes from "./modules/app/route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/app", appRoutes);

export default router;
