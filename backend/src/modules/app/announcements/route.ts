import { Router } from "express";
import { announcementsController } from "./controller";

const router = Router();

router.get("/", announcementsController.getAnnouncements.bind(announcementsController));

export default router;
