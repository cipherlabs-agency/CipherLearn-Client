import { Router } from "express";
import authRoutes from "./modules/auth/routes.auth";
import dashboardRoutes from "./modules/dashboard/routes";
import appRoutes from "./modules/app/route";
import studentAuthRoutes from "./modules/app/auth/route";
import { generalRateLimiter } from "./middleware/rateLimiter";
import publicLandingPageRoutes from "./modules/public/landing-pages/route";

const router = Router();

// Dashboard auth routes (login/signup apply their own limiters per-route)
router.use("/auth", authRoutes);

// Dashboard routes - general rate limit (auth handled per-route by isAdmin/isAdminOrTeacher)
router.use("/dashboard", generalRateLimiter, dashboardRoutes);

// Student app auth routes (public - before protected app routes)
router.use("/app/auth", studentAuthRoutes);

// Protected student app routes with rate limiting
router.use("/app", generalRateLimiter, appRoutes);

// Public landing pages
router.use("/public/landing-pages", publicLandingPageRoutes);

export default router;
