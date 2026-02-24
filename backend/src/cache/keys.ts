/**
 * Cache key generators with built-in input sanitization and tenant scoping.
 *
 * All keys are automatically prefixed with `t:{tenantId}:` using
 * AsyncLocalStorage so no service code needs to change.
 */

import { tenantStorage } from "../utils/tenantStorage";

/**
 * Reject non-finite, negative, or non-integer values to prevent key injection.
 */
function sanitizeId(value: number): number {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new Error(`Invalid cache key id: ${value}`);
  }
  return value;
}

/**
 * Strip non-alphanumeric characters (except - and _), truncate to 64 chars.
 */
function sanitizeString(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

/**
 * Returns `t:{tenantId}` prefix. Falls back to `t:0` for requests without
 * tenant context (dev mode, migration scripts, etc.).
 */
function tenantPrefix(): string {
  const tenantId = tenantStorage.getStore();
  return tenantId !== undefined ? `t:${tenantId}` : "t:0";
}

/**
 * Join parts with `:`, cap total key length at 256 chars.
 */
function buildKey(...parts: (string | number)[]): string {
  return parts.map(String).join(":").slice(0, 256);
}

// ========================
// Dashboard key generators
// ========================

export const DashboardKeys = {
  analyticsStats: () =>
    buildKey(tenantPrefix(), "dash", "analytics", "stats"),

  enrollmentTrends: (months: number) =>
    buildKey(
      tenantPrefix(),
      "dash",
      "analytics",
      "enrollment-trends",
      sanitizeId(months)
    ),

  attendanceTrends: (days: number, batchId?: number) =>
    buildKey(
      tenantPrefix(),
      "dash",
      "analytics",
      "attendance-trends",
      sanitizeId(days),
      batchId != null ? sanitizeId(batchId) : "all"
    ),

  monthlyAttendanceTrends: (months: number, batchId?: number) =>
    buildKey(
      tenantPrefix(),
      "dash",
      "analytics",
      "monthly-att-trends",
      sanitizeId(months),
      batchId != null ? sanitizeId(batchId) : "all"
    ),

  batchDistribution: () =>
    buildKey(tenantPrefix(), "dash", "analytics", "batch-dist"),

  recentActivities: (limit: number) =>
    buildKey(
      tenantPrefix(),
      "dash",
      "analytics",
      "recent",
      sanitizeId(limit)
    ),

  batchList: () => buildKey(tenantPrefix(), "dash", "batches", "list"),

  batchDetail: (id: number) =>
    buildKey(tenantPrefix(), "dash", "batches", "detail", sanitizeId(id)),

  studentList: (batchId?: number) =>
    buildKey(
      tenantPrefix(),
      "dash",
      "students",
      "list",
      batchId != null ? sanitizeId(batchId) : "all"
    ),
};

// ========================
// App key generators
// ========================

export const AppKeys = {
  videos: (batchId: number, limit?: number) =>
    buildKey(
      tenantPrefix(),
      "app",
      "resources",
      "videos",
      sanitizeId(batchId),
      limit != null ? sanitizeId(limit) : "all"
    ),

  notes: (batchId: number, limit?: number) =>
    buildKey(
      tenantPrefix(),
      "app",
      "resources",
      "notes",
      sanitizeId(batchId),
      limit != null ? sanitizeId(limit) : "all"
    ),

  materials: (batchId: number, limit?: number) =>
    buildKey(
      tenantPrefix(),
      "app",
      "resources",
      "materials",
      sanitizeId(batchId),
      limit != null ? sanitizeId(limit) : "all"
    ),

  announcementList: (
    category: string,
    search: string,
    page: number,
    limit: number
  ) =>
    buildKey(
      tenantPrefix(),
      "app",
      "ann",
      "list",
      sanitizeString(category),
      sanitizeString(search),
      sanitizeId(page),
      sanitizeId(limit)
    ),

  announcementDetail: (id: number) =>
    buildKey(tenantPrefix(), "app", "ann", "detail", sanitizeId(id)),

  feeStructures: (batchId: number) =>
    buildKey(tenantPrefix(), "app", "fees", "structures", sanitizeId(batchId)),

  profile: (studentId: number) =>
    buildKey(tenantPrefix(), "app", "profile", sanitizeId(studentId)),

  attendancePerf: (studentId: number, batchId: number) =>
    buildKey(
      tenantPrefix(),
      "app",
      "attendance",
      "perf",
      sanitizeId(studentId),
      sanitizeId(batchId)
    ),

  attendanceCalendar: (
    studentId: number,
    batchId: number,
    month: number,
    year: number
  ) =>
    buildKey(
      tenantPrefix(),
      "app",
      "attendance",
      "calendar",
      sanitizeId(studentId),
      sanitizeId(batchId),
      sanitizeId(month),
      sanitizeId(year)
    ),

  notifPrefs: (studentId: number) =>
    buildKey(tenantPrefix(), "app", "notif", "prefs", sanitizeId(studentId)),
};

// ========================
// Invalidation prefixes
// (functions so they pick up the current tenant from AsyncLocalStorage)
// ========================

export const InvalidationPatterns = {
  dashAnalytics: () => buildKey(tenantPrefix(), "dash", "analytics") + ":",
  dashBatches: () => buildKey(tenantPrefix(), "dash", "batches") + ":",
  dashStudents: () => buildKey(tenantPrefix(), "dash", "students") + ":",
  appResources: () => buildKey(tenantPrefix(), "app", "resources") + ":",
  appAnnouncements: () => buildKey(tenantPrefix(), "app", "ann") + ":",
  appFees: () => buildKey(tenantPrefix(), "app", "fees") + ":",
  appProfile: () => buildKey(tenantPrefix(), "app", "profile") + ":",
  appAttendance: () => buildKey(tenantPrefix(), "app", "attendance") + ":",
  appNotifPrefs: () => buildKey(tenantPrefix(), "app", "notif") + ":",
};
