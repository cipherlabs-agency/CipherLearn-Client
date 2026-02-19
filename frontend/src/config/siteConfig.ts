/**
 * Site Config — White-label branding
 *
 * All values are driven by NEXT_PUBLIC_* env vars.
 * Change .env → entire app rebrands. Zero code changes.
 */

export const siteConfig = {
    /** Class / institute name shown in sidebar, login, page titles */
    appName: process.env.NEXT_PUBLIC_APP_NAME || "CipherLearn",

    /** Short tagline shown below logo ("Teaching Platform", "Coaching Classes", etc.) */
    appTagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Teaching Platform",

    /** SEO meta description */
    appDescription:
        process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
        "Comprehensive management solution for tuition centers and educators.",

    /** Optional: URL to a custom logo image. If empty, uses default graduation-cap SVG. */
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",
} as const

export type SiteConfig = typeof siteConfig
