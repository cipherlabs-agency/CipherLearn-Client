import { Router } from "express";
import { assignmentsController } from "./controller";

const router = Router();

router.get("/", assignmentsController.getAssignments.bind(assignmentsController));

export default router;
