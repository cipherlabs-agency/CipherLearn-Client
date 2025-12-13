import { Router } from "express";
import studentEnrollmentRoutes from "./student-enrollment/route";

const router = Router();

router.use("/analytics");
router.use("/attendance");
router.use("/batches");
router.use("/fees");
router.use("/notes");
router.use("/student-enrollment", studentEnrollmentRoutes);
router.use("/youtube-videos");

export default router;
