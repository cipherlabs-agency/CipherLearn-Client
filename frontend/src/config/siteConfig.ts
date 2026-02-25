/**
 * Site Config — Per-deployment white-label branding & feature flags.
 *
 * Each coaching class gets their own deployment.
 * Set these NEXT_PUBLIC_* env vars when provisioning a new deployment.
 * Zero code changes required to rebrand.
 */

export const siteConfig = {
  /** Class / institute name shown in sidebar, login, page titles */
  appName: process.env.NEXT_PUBLIC_APP_NAME || "CipherLearn",

  /** Short tagline shown below logo */
  appTagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Teaching Platform",

  /** SEO meta description */
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Comprehensive management solution for tuition centers and educators.",

  /** Optional: URL to a custom logo image. If empty, uses default icon. */
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",

  /** Initials shown in logo when no image is provided (max 2 chars) */
  logoInitials: process.env.NEXT_PUBLIC_LOGO_INITIALS || "CL",

  /** Brand primary color (hex) */
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0F766E",

  /** Brand accent color (hex) */
  accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "#F59E0B",

  /** Contact email shown on error pages */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@cipherlearn.com",

  /** Feature flags — default all ON; set to "false" to disable per deployment */
  features: {
    qrAttendance: process.env.NEXT_PUBLIC_FEATURE_QR_ATTENDANCE !== "false",
    fees: process.env.NEXT_PUBLIC_FEATURE_FEES !== "false",
    assignments: process.env.NEXT_PUBLIC_FEATURE_ASSIGNMENTS !== "false",
    studyMaterials: process.env.NEXT_PUBLIC_FEATURE_STUDY_MATERIALS !== "false",
    announcements: process.env.NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS !== "false",
    videos: process.env.NEXT_PUBLIC_FEATURE_VIDEOS !== "false",
  },
} as const;

export type SiteConfig = typeof siteConfig;
