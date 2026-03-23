import { Router } from "express";
import studentEnrollmentRoutes from "./student-enrollment/route";
import batchesRoutes from "./batches/route";
import attendanceRoutes from "./attendance/route";
import youtubeVideoRoutes from "./youtube-videos/route";
import notesRoutes from "./notes/route";
import analyticsRoutes from "./analytics/route";
import assignmentsRoutes from "./assignments/route";
import announcementsRoutes from "./announcements/route";
import studyMaterialsRoutes from "./study-materials/route";
import feesRoutes from "./fees/route";
import teachersRoutes from "./teachers/route";
import lecturesRoutes from "./lectures/route";
import testsRoutes from "./tests/route";
import instagramRoutes from "./instagram/route";
import settingsRoutes from "./settings/route";
import notificationRoutes from "./notifications/route";
import maintenanceRoutes from "./maintenance/route";

const router = Router();

router.use("/analytics", analyticsRoutes);
router.use("/announcements", announcementsRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/batches", batchesRoutes);
router.use("/fees", feesRoutes);
router.use("/instagram", instagramRoutes);
router.use("/lectures", lecturesRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/notes", notesRoutes);
router.use("/student-enrollment", studentEnrollmentRoutes);
router.use("/study-materials", studyMaterialsRoutes);
router.use("/teachers", teachersRoutes);
router.use("/tests", testsRoutes);
router.use("/youtube-videos", youtubeVideoRoutes);
router.use("/settings", settingsRoutes);
router.use("/notifications", notificationRoutes);

export default router;

