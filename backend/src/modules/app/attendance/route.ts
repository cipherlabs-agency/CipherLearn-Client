import { Router } from "express";
import { attendanceController } from "./controller";

const router = Router();

router.get("/", attendanceController.getAttendance.bind(attendanceController));
router.post("/mark-qr", attendanceController.markQRAttendance.bind(attendanceController));

export default router;
