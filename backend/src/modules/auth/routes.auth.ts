import { Router } from "express";
import AuthController from "./controller.auth";
import { AuthValidations, validateRequest } from "./validations.auth";
import { isAdmin } from "./middleware";

const router = Router();

const controller = new AuthController();

router.post(
  "/signup",
  isAdmin,
  validateRequest(AuthValidations.signUp),
  controller.signup
);
router.post("/login", validateRequest(AuthValidations.login), controller.login);

export default router;
