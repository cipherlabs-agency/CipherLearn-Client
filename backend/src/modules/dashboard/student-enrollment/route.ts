import { Router } from "express";
import { validateRequest } from "../../auth/validations.auth";
import { StudentValidations } from "./validation";
import StudentEnrollmentController from "./controller";
import { upload } from "../../../config/multer.config";

const router = Router();
const controller = new StudentEnrollmentController();

router.post(
  "/enroll",
  validateRequest(StudentValidations.enroll),
  controller.enrollSingle.bind(controller)
);

router.post(
  "/enroll-with-csv",
  validateRequest(StudentValidations.enroll),
  upload.single("file"),
  controller.enrollCSV.bind(controller)
);

export default router;
