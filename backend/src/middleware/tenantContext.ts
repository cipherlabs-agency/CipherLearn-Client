import { Request, Response, NextFunction } from "express";
import { tenantStorage } from "../utils/tenantStorage";
import { config } from "../config/env.config";

/**
 * Routes that bypass tenant resolution entirely.
 * Portal routes are self-contained; auth routes resolve tenant from body.
 */
const BYPASS_PREFIXES = [
  "/api/portal",
  "/api/tenant/config",
];

/**
 * Resolve tenant from the DB using its slug.
 * Uses a raw query to avoid circular dependency with the extended prisma client.
 */
async function findTenantBySlug(slug: string) {
  // Lazy import to avoid circular deps at module load time
  const { prisma } = await import("../config/db.config");
  return (prisma as any).$queryRaw`
    SELECT id, slug, "subscriptionStatus", "suspendedReason", "deletedAt"
    FROM tenants
    WHERE slug = ${slug} AND "deletedAt" IS NULL
    LIMIT 1
  `.then((rows: any[]) => rows[0] || null);
}

async function findTenantByDomain(domain: string) {
  const { prisma } = await import("../config/db.config");
  return (prisma as any).$queryRaw`
    SELECT id, slug, "subscriptionStatus", "suspendedReason", "deletedAt"
    FROM tenants
    WHERE ("customDomain" = ${domain} OR slug = ${domain}) AND "deletedAt" IS NULL
    LIMIT 1
  `.then((rows: any[]) => rows[0] || null);
}

/**
 * Tenant Context Middleware
 *
 * Priority order for resolving tenantId:
 * 1. JWT decoded.tenantId (set by auth middleware on authenticated requests)
 * 2. X-Tenant-Slug header (unauthenticated requests, API clients)
 * 3. Subdomain from req.hostname (e.g. shree-academy.cipherlearn.com)
 * 4. DEFAULT_TENANT_SLUG env var (local dev / single-tenant mode)
 *
 * Sets req.tenantId and runs next() inside tenantStorage.run() context.
 */
export const tenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip for bypass routes
  const isBypass = BYPASS_PREFIXES.some((prefix) =>
    req.path.startsWith(prefix)
  );
  if (isBypass) {
    return next();
  }

  try {
    let tenant: any = null;

    // Priority 1: JWT-decoded tenantId (fastest — no DB lookup needed)
    // Auth middleware sets req.tenantId from JWT; if already set, use it
    if ((req as any).tenantId) {
      return tenantStorage.run((req as any).tenantId, next);
    }

    // Priority 2: X-Tenant-Slug header
    const headerSlug = req.headers["x-tenant-slug"] as string | undefined;
    if (headerSlug) {
      tenant = await findTenantBySlug(headerSlug);
    }

    // Priority 3: Subdomain (e.g. shree-academy.cipherlearn.com)
    if (!tenant) {
      const hostname = req.hostname || "";
      const parts = hostname.split(".");
      // Expect: subdomain.cipherlearn.com (3+ parts)
      if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain && subdomain !== "www" && subdomain !== "portal") {
          tenant = await findTenantByDomain(subdomain);
        }
      }
    }

    // Priority 4: Default slug for local dev
    if (!tenant) {
      const defaultSlug = config.TENANT.DEFAULT_SLUG;
      if (defaultSlug) {
        tenant = await findTenantBySlug(defaultSlug);
      }
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
        code: "TENANT_NOT_FOUND",
      });
    }

    // Check subscription status
    if (tenant.subscriptionStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Your organization's account has been suspended. Please contact support.",
        code: "TENANT_SUSPENDED",
        reason: tenant.suspendedReason || undefined,
      });
    }

    if (
      tenant.subscriptionStatus === "EXPIRED" ||
      tenant.subscriptionStatus === "CANCELLED"
    ) {
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired. Please renew to continue.",
        code: "TENANT_EXPIRED",
      });
    }

    // Attach to request and run in tenant storage context
    (req as any).tenantId = tenant.id;
    (req as any).tenant = tenant;

    return tenantStorage.run(tenant.id, next);
  } catch (error) {
    console.error("[tenantContext] Error resolving tenant:", error);
    // In dev/fallback mode: proceed without tenant context (backward compatible)
    return next();
  }
};
