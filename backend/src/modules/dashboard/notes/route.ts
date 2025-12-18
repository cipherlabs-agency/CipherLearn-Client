import { Router } from "express";
import NotesController from "./controller";

const router = Router();
const controller = new NotesController();

router.post("/upload", controller.upload.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.post("/draft", controller.draft.bind(controller));

export default router;
