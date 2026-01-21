import { Router } from "express";
import { resourcesController } from "./controller";

const router = Router();

router.get("/videos", resourcesController.getVideos.bind(resourcesController));
router.get("/notes", resourcesController.getNotes.bind(resourcesController));
router.get("/study-materials", resourcesController.getStudyMaterials.bind(resourcesController));

export default router;
