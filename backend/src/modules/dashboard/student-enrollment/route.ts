import { Router } from "express";
import { validateRequest } from "../../auth/validations.auth";
import { StudentValidations } from "./validation";
import StudentEnrollmentController from "./controller";
import upload from "../../../config/multer.config";
import { isAdmin, isAuthenticated } from "../../auth/middleware";

const router = Router();
const controller = new StudentEnrollmentController();

router.use(isAuthenticated);

router.post(
  "/enroll",
  isAdmin,
  validateRequest(StudentValidations.enroll),
  controller.enrollSingle.bind(controller)
);

router.post(
  "/enroll-with-csv",
  isAdmin,
  validateRequest(StudentValidations.enroll),
  upload.single("file"),
  controller.enrollCSV.bind(controller)
);

router.get("/students/:id", controller.getAll.bind(controller));

export default router;
