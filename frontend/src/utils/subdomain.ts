/**
 * Resolves the current tenant slug from:
 * 1. window.location.hostname subdomain (production: shree-academy.cipherlearn.com)
 * 2. NEXT_PUBLIC_TENANT_SLUG env var (development / single-tenant override)
 * 3. Fallback to "default"
 */
export function getTenantSlug(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_TENANT_SLUG || "default";
  }

  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // Expect: subdomain.cipherlearn.com (3+ parts)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore reserved subdomains
    if (
      subdomain &&
      !["www", "portal", "api", "mail", "app"].includes(subdomain)
    ) {
      return subdomain;
    }
  }

  // Fall back to env var or "default"
  return process.env.NEXT_PUBLIC_TENANT_SLUG || "default";
}
