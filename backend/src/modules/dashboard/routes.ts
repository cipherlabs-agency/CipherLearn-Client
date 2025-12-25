import { Router } from "express";
import studentEnrollmentRoutes from "./student-enrollment/route";
import batchesRoutes from "./batches/route";
import attendanceRoutes from "./attendance/route";
import youtubeVideoRoutes from "./youtube-videos/route";
import notesRoutes from "./notes/route";

const router = Router();

// router.use("/analytics");
router.use("/attendance", attendanceRoutes);
router.use("/batches", batchesRoutes);
// router.use("/fees");
router.use("/notes", notesRoutes);
router.use("/student-enrollment", studentEnrollmentRoutes);
router.use("/youtube-videos", youtubeVideoRoutes);

export default router;
