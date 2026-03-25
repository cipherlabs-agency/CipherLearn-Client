import { Router } from "express";
import { prisma } from "../../../config/db.config";
import logger from "../../../utils/logger";

const router = Router();

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const landingPage = await prisma.landingPage.findUnique({
      where: { slug },
      include: {
        batch: {
          select: { name: true, id: true }
        }
      }
    });

    if (!landingPage || !landingPage.isPublished) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    return res.status(200).json({ success: true, data: landingPage });
  } catch (error) {
    logger.error("PublicLandingPages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
