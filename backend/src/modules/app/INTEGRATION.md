# App Backend — Section C gap endpoints: integration guide

These new submodules add the teacher/admin features (Section C of `APP_BACKEND_SPEC.md`) to the **app API** (`/api/app/*`). They are **standalone** and **reuse the existing dashboard services** — no existing module files are modified except two small, clearly-marked edits below.

Copy these folders into `src/modules/app/` of the deployed backend (`CipherLearn-Client/backend`):

```
app/analytics/          (C1) reuses dashboard AnalyticsService
app/fee-receipts/       (C2) reuses dashboard FeesService
app/settings-admin/     (C5) reuses dashboard settingsService
app/students-csv/       (C3) reuses dashboard StudentEnrollmentService + multer
app/data-recovery/      (C4) reuses StudentEnrollmentService + BatchService
app/lecture-mgmt/       (C6) reuses dashboard LectureService
app/leads/              (C7) reuses dashboard CRMService
app/notifications-ext/  (C8) reuses dashboard notificationService + pushNotifications + prisma
app/attendance-qr/      (C9) reuses dashboard qrAttendanceService
```

All import paths assume the standard `src/modules/app/<feature>/` depth (same as existing modules). No `node_modules` was available to type-check here — please run `tsc`/build once integrated.

---

## 1. Register the routers — edit `src/modules/app/route.ts`

**Add imports** (with the other submodule imports near the top):

```ts
import analyticsRoutes from "./analytics/route";
import feeReceiptsRoutes from "./fee-receipts/route";
import settingsAdminRoutes from "./settings-admin/route";
import studentsCsvRoutes from "./students-csv/route";
import dataRecoveryRoutes from "./data-recovery/route";
import lectureMgmtRoutes from "./lecture-mgmt/route";
import leadsRoutes from "./leads/route";
import notificationsExtRoutes from "./notifications-ext/route";
import attendanceQrRoutes from "./attendance-qr/route";
```

**Add mounts.** The four "additional" routers share a base path with an existing module — mount them **right after** the matching existing `router.use(...)` line (paths do not collide):

```ts
router.use("/fees", feesRoutes);
router.use("/fees", feeReceiptsRoutes);                 // C2 — add this line

router.use("/attendance", attendanceRoutes);
router.use("/attendance", attendanceQrRoutes);          // C9 — add this line

router.use("/notifications", isAppUser, notificationsRoutes);
router.use("/notifications", notificationsExtRoutes);   // C8 — add this line

router.use("/lectures", isAppUser, appLecturesRoutes);
router.use("/lectures", isAppUser, lectureMgmtRoutes);  // C6 — add this line
```

The standalone routers — add these **immediately before** `router.use("/admin", adminRoutes);` so the specific `/admin/*` paths match before the generic admin router:

```ts
router.use("/analytics", analyticsRoutes);              // C1
router.use("/admin/settings", settingsAdminRoutes);     // C5
router.use("/admin/students-csv", studentsCsvRoutes);   // C3
router.use("/admin/recovery", dataRecoveryRoutes);      // C4
router.use("/admin/leads", leadsRoutes);                // C7

router.use("/admin", adminRoutes);                       // existing — keep last
```

## 2. C9 — re-enable student QR self-marking — edit `src/modules/app/attendance/route.ts`

Uncomment the disabled line (~line 103):

```ts
router.post("/mark-qr", isStudent, attendanceController.markQRAttendance.bind(attendanceController));
```

Requirements: `QR_SECRET` env set, `qRAttendanceToken` table migrated, and `config.FEATURES.QR_ATTENDANCE = true`. Teachers generate the daily code via the new `POST /app/attendance/teacher/qr-token`.

---

## 3. Resulting new endpoints

| Feature | Method · Path | Role |
|---|---|---|
| C1 | GET `/app/analytics/overview`, `/attendance-trends`, `/recent-activities` | teacher(+canViewAnalytics)/admin |
| C1 | GET `/app/analytics/enrollment-trends`, `/batch-distribution` | admin |
| C2 | POST `/app/fees/teacher/receipts`, PUT/DELETE `/app/fees/teacher/receipts/:id`, GET `/app/fees/teacher/receipts-summary` | teacher(+canViewFees) (DELETE admin) |
| C2 | POST `/app/fees/teacher/receipts/bulk` | admin |
| C3 | GET `/app/admin/students-csv/template`, POST `/preview`, POST `/import` | admin |
| C4 | GET/PUT/DELETE under `/app/admin/recovery/students` & `/batches` | admin |
| C5 | GET/PUT `/app/admin/settings`, PUT `/teacher-permissions`, POST `/teacher-permissions/reset` | admin |
| C6 | POST `/app/lectures/teacher/bulk` (canManageLectures), PUT `/app/lectures/teacher/:id/assign` (admin) | teacher/admin |
| C7 | GET `/app/admin/leads` | admin |
| C8 | GET `/app/notifications/unread-count` (any), POST `/app/notifications/broadcast` (admin) | mixed |
| C9 | POST `/app/attendance/teacher/qr-token`, GET `/qr-status/:batchId` (teacher) + student `/mark-qr` | teacher/student |

## 4. Notes / follow-ups
- **Validation:** new modules use lightweight inline checks. To match house style, add Joi `validate(...)` schemas per module (see existing `fees/validation.ts`).
- **Leads update:** `GET /app/admin/leads` only. Lead status update needs an `updateLeadStatus` method on `CRMService` first, then a `PUT /app/admin/leads/:id`.
- **Broadcast push** uses `pushNotifications` with the `schoolAnnouncements` preference key; adjust the key/permission if you want a different audience.
- **Analytics service is org-wide.** If teachers should see only their own batches, add batch-scoped variants to `AnalyticsService` and pass `req.user.id`.
