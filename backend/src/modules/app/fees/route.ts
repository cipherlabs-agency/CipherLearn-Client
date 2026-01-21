import { Router } from "express";
import { feesController } from "./controller";

const router = Router();

router.get("/receipts", feesController.getFeeReceipts.bind(feesController));
router.get("/summary", feesController.getFeesSummary.bind(feesController));

export default router;
