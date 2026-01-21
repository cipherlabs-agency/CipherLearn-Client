import { Router } from "express";
import { profileController } from "./controller";

const router = Router();

router.get("/", profileController.getProfile.bind(profileController));

export default router;
