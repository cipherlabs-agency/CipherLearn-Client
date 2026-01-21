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

const router = Router();

router.use("/analytics", analyticsRoutes);
router.use("/announcements", announcementsRoutes);
router.use("/assignments", assignmentsRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/batches", batchesRoutes);
router.use("/fees", feesRoutes);
router.use("/notes", notesRoutes);
router.use("/student-enrollment", studentEnrollmentRoutes);
router.use("/study-materials", studyMaterialsRoutes);
router.use("/youtube-videos", youtubeVideoRoutes);

export default router;
