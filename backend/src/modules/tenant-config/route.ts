import { Router, Request, Response } from "express";
import { prisma } from "../../config/db.config";

const router = Router();

router.get("/config", async (req: Request, res: Response) => {
  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ success: false, message: "slug is required" });
    }

    const [tenant] = await (prisma as any).$queryRaw`
      SELECT
        id, name, slug, logo, "logoInitials",
        "primaryColor", "accentColor", "contactEmail",
        "subscriptionStatus",
        "featureQRAttendance", "featureAssignments", "featureFees",
        "featureStudyMaterials", "featureAnnouncements", "featureVideos"
      FROM tenants
      WHERE slug = ${slug} AND "deletedAt" IS NULL
      LIMIT 1
    `;

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    return res.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        logoInitials: tenant.logoInitials,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
        contactEmail: tenant.contactEmail,
        subscriptionStatus: tenant.subscriptionStatus,
        features: {
          qrAttendance: tenant.featureQRAttendance,
          assignments: tenant.featureAssignments,
          fees: tenant.featureFees,
          studyMaterials: tenant.featureStudyMaterials,
          announcements: tenant.featureAnnouncements,
          videos: tenant.featureVideos,
        },
      },
    });
  } catch (error) {
    console.error("[tenant-config]", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
