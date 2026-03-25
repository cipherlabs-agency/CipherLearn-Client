/**
 * Cache key generators with built-in input sanitization.
 */

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
 * Join parts with `:`, cap total key length at 256 chars.
 */
function buildKey(...parts: (string | number)[]): string {
  return parts.map(String).join(":").slice(0, 256);
}

// ========================
// Dashboard key generators
// ========================

export const DashboardKeys = {
  analyticsStats: () => buildKey("dash", "analytics", "stats"),

  enrollmentTrends: (months: number) =>
    buildKey("dash", "analytics", "enrollment-trends", sanitizeId(months)),

  attendanceTrends: (days: number, batchId?: number) =>
    buildKey(
      "dash",
      "analytics",
      "attendance-trends",
      sanitizeId(days),
      batchId != null ? sanitizeId(batchId) : "all"
    ),

  monthlyAttendanceTrends: (months: number, batchId?: number) =>
    buildKey(
      "dash",
      "analytics",
      "monthly-att-trends",
      sanitizeId(months),
      batchId != null ? sanitizeId(batchId) : "all"
    ),

  batchDistribution: () => buildKey("dash", "analytics", "batch-dist"),

  recentActivities: (limit: number) =>
    buildKey("dash", "analytics", "recent", sanitizeId(limit)),

  batchList: () => buildKey("dash", "batches", "list"),

  batchDetail: (id: number) =>
    buildKey("dash", "batches", "detail", sanitizeId(id)),

  studentList: (batchId?: number) =>
    buildKey("dash", "students", "list", batchId != null ? sanitizeId(batchId) : "all"),

  studentDeletedList: () => buildKey("dash", "students", "deleted"),

  batchDrafts: () => buildKey("dash", "batches", "drafts"),

  settings: () => buildKey("dash", "settings"),

  feeReceiptsSummary: (batchId?: number, studentId?: number, academicYear?: number) =>
    buildKey(
      "dash",
      "fees",
      "summary",
      batchId != null ? sanitizeId(batchId) : "all",
      studentId != null ? sanitizeId(studentId) : "all",
      academicYear != null ? sanitizeId(academicYear) : "all"
    ),
};

// ========================
// App key generators
// ========================

export const AppKeys = {
  videos: (batchId: number, limit?: number) =>
    buildKey("app", "resources", "videos", sanitizeId(batchId), limit != null ? sanitizeId(limit) : "all"),

  notes: (batchId: number, limit?: number) =>
    buildKey("app", "resources", "notes", sanitizeId(batchId), limit != null ? sanitizeId(limit) : "all"),

  materials: (batchId: number, limit?: number) =>
    buildKey("app", "resources", "materials", sanitizeId(batchId), limit != null ? sanitizeId(limit) : "all"),

  // Announcement list: scoped by category + page + limit
  announcementList: (category: string, search: string, page: number, limit: number) =>
    buildKey("app", "ann", "list", sanitizeString(category), sanitizeString(search), sanitizeId(page), sanitizeId(limit)),

  // Announcement detail: per id
  announcementDetail: (id: number) =>
    buildKey("app", "ann", "detail", sanitizeId(id)),

  feeStructures: (batchId: number) =>
    buildKey("app", "fees", "structures", sanitizeId(batchId)),

  profile: (studentId: number) =>
    buildKey("app", "profile", sanitizeId(studentId)),

  attendancePerf: (studentId: number, batchId: number) =>
    buildKey("app", "attendance", "perf", sanitizeId(studentId), sanitizeId(batchId)),

  attendanceCalendar: (studentId: number, batchId: number, month: number, year: number) =>
    buildKey(
      "app",
      "attendance",
      "calendar",
      sanitizeId(studentId),
      sanitizeId(batchId),
      sanitizeId(month),
      sanitizeId(year)
    ),

  // Notification preferences: per student
  notifPrefs: (studentId: number) =>
    buildKey("app", "notif", "prefs", sanitizeId(studentId)),

  // Starred resources: per student
  starredResources: (studentId: number) =>
    buildKey("app", "starred", sanitizeId(studentId)),
};

// ========================
// Invalidation prefixes
// ========================

export const InvalidationPatterns = {
  dashAnalytics: "dash:analytics:",
  dashBatches: "dash:batches:",
  dashStudents: "dash:students:",
  dashFees: "dash:fees:",
  dashSettings: "dash:settings",
  appResources: "app:resources:",
  appAnnouncements: "app:ann:",
  appFees: "app:fees:",
  appProfile: "app:profile:",
  appAttendance: "app:attendance:",
  appNotifPrefs: "app:notif:",
  appStarred: "app:starred:",
};
