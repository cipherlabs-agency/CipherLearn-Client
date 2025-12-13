import { Router } from "express";
import authRoutes from "./modules/auth/routes.auth";

const router = Router();

router.use("/auth", authRoutes);
// router.use("/dashboard");

export default router;
