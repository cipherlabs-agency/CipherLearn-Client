import { Router } from "express";
import AuthController from "./controller.auth";
import { AuthValidations, validateRequest } from "./validations.auth";
import { isAdmin, isAuthenticated } from "./middleware";

const router = Router();

const controller = new AuthController();

router.post(
  "/signup",
  // isAdmin,
  validateRequest(AuthValidations.signUp),
  controller.signup
);
router.post("/login", validateRequest(AuthValidations.login), controller.login);
router.post("/check-email", controller.checkEmail.bind(controller));
router.post("/logout", controller.logout.bind(controller));
router.post("/request-password-reset", controller.forgotPassword.bind(controller));
router.post("/reset-password", controller.resetPassword.bind(controller));

router.put(
  "/profile",
  isAuthenticated,
  controller.updateProfile.bind(controller)
);

export default router;
