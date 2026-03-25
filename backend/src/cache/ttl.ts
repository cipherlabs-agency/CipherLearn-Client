/**
 * TTL constants (in seconds) for cache entries, grouped by domain.
 */

// Dashboard analytics
export const DASHBOARD_STATS = 120;
export const ENROLLMENT_TRENDS = 600;
export const ATTENDANCE_TRENDS = 600;
export const BATCH_DISTRIBUTION = 600;
export const RECENT_ACTIVITIES = 120;

// Dashboard CRUD
export const BATCH_LIST = 300;
export const BATCH_DETAIL = 300;
export const STUDENT_LIST = 300;

// App resources (unfiltered only)
export const APP_VIDEOS = 600;
export const APP_NOTES = 600;
export const APP_MATERIALS = 600;

// App announcements
export const APP_ANNOUNCEMENT_LIST = 180;   // 3 min — list changes when new ones added
export const APP_ANNOUNCEMENT_DETAIL = 300; // 5 min — detail is stable

// App misc
export const APP_FEE_STRUCTURES = 3600;
export const APP_PROFILE = 300;

// App notifications
export const APP_NOTIF_PREFS = 600; // 10 min — preferences rarely change

// App attendance
export const APP_ATTENDANCE_PERF = 120;
export const APP_ATTENDANCE_CALENDAR = 120;

// App starred resources (student bookmarks)
export const APP_STARRED_RESOURCES = 300;

// Dashboard — additional entries
export const STUDENT_DELETED_LIST = 120;   // 2 min — deleted list refreshes after restore/delete
export const BATCH_DRAFTS = 120;           // 2 min
export const SETTINGS = 300;              // 5 min — settings rarely change
export const FEE_RECEIPTS_SUMMARY = 120;  // 2 min — summary may change with payments
