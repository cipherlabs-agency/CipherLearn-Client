# CipherLearn Admin Portal — Implementation Brief

> **This document is the authoritative brief for building the CipherLearn Admin Portal.**
> The Admin Portal lives in a **separate repository** (`portal/` — standalone Next.js app).
> The main CipherLearn backend and frontend have already been updated for multi-tenancy.
> Your job is to build ONLY the portal frontend that talks to the existing `/api/portal/*` endpoints.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  client/ repo  (already built)                              │
│                                                             │
│  backend/  ← Express server (single deployment)            │
│    /api/dashboard/*  ← tenant admin/teacher dashboard API  │
│    /api/app/*        ← student/teacher mobile app API      │
│    /api/auth/*       ← tenant user authentication          │
│    /api/portal/*     ← SuperAdmin portal API  ← YOU CALL   │
│    /api/tenant/config ← public tenant config               │
│                                                             │
│  frontend/  ← Next.js (coaching class dashboard)           │
│                                                             │
│  Prisma schema + PostgreSQL  (single shared DB)            │
│    All models live here: Tenant, SuperAdmin, User, etc.     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  portal/ repo  (THIS REPO — what you are building)         │
│                                                             │
│  Next.js frontend ONLY — no backend, no DB, no Prisma      │
│  Deployed at portal.cipherlearn.com                        │
│  Calls https://api.cipherlearn.com/api/portal/*            │
└─────────────────────────────────────────────────────────────┘
```

**Why are `Tenant`, `SuperAdmin`, `AdminAuditLog` etc. in the client repo?**
- There is only ONE PostgreSQL database shared by everything
- The `Tenant` model is used by the client app on EVERY API request (tenantContext middleware reads it)
- The Portal API backend (`/api/portal/*`) runs on the SAME Express server — not a separate service
- The portal frontend (this repo) makes HTTP calls to those endpoints; it has no direct DB access

---

## 1. What Is Already Done (main `client/` repo)

### 1.1 Backend — Already Implemented

The following backend changes are **complete** in the main repo. Do NOT reimplement them.

**Prisma Schema** — `backend/prisma/schema.prisma`:
- New models: `Tenant`, `SuperAdmin`, `TenantQuotaOverride`, `AdminAuditLog`, `PlatformConfig`, `TenantConfig`
- New enums: `TenantPlan` (FREE/STARTER/PRO/ENTERPRISE), `SubscriptionStatus` (ACTIVE/TRIAL/SUSPENDED/CANCELLED/EXPIRED), `SuperAdminRole` (OWNER/ADMIN/SUPPORT)
- `tenantId Int?` added to all existing models (User, Student, Batch, Attendance, etc.)

**Backend Utilities**:
- `backend/src/utils/tenantStorage.ts` — `AsyncLocalStorage<number>` for tenant context
- `backend/src/utils/encryption.ts` — `encrypt(value)` / `decrypt(value)` AES-256-GCM
- `backend/src/utils/quota.ts` — `checkStudentQuota`, `checkBatchQuota`, `checkTeacherQuota`, `checkFeatureEnabled`
- `backend/src/constants/plans.ts` — `PLAN_DEFAULTS` map with maxStudents/maxBatches/etc per plan

**Auth**:
- `generateSuperAdminToken({ id, email, role })` — portal JWT signed with `SUPER_ADMIN_JWT_SECRET`
- `verifySuperAdminToken(token)` — validates portal JWT
- `isSuperAdmin` middleware — validates portal JWT, attaches `req.superAdmin`
- `isSuperOwner` middleware — additionally checks `role === 'OWNER'`

**Portal API Routes** — all mounted at `/api/portal/`:

```
POST   /api/portal/auth/login           Body: { email, password } → { token, superAdmin }
POST   /api/portal/auth/logout
GET    /api/portal/auth/me

GET    /api/portal/tenants              Query: page, limit, search, plan, status
POST   /api/portal/tenants              Create tenant + first admin user
GET    /api/portal/tenants/slug-check   Query: slug → { available: boolean }
GET    /api/portal/tenants/:id          Full tenant detail + studentCount, batchCount, teacherCount
PATCH  /api/portal/tenants/:id          Update basic info
PATCH  /api/portal/tenants/:id/branding
PATCH  /api/portal/tenants/:id/subscription  (plan change, dates, quotaOverride)
PATCH  /api/portal/tenants/:id/permissions   Body: { teacherPermissions: {...} }
POST   /api/portal/tenants/:id/suspend  Body: { reason }
POST   /api/portal/tenants/:id/resume
POST   /api/portal/tenants/:id/cancel
DELETE /api/portal/tenants/:id          Soft delete
DELETE /api/portal/tenants/:id/purge    Hard delete ALL data (OWNER only)
GET    /api/portal/tenants/:id/usage    { maxStudents, studentCount, maxBatches, batchCount, ... }
GET    /api/portal/tenants/:id/users    Admin + Teacher users for this tenant
POST   /api/portal/tenants/:id/users/reset-password  Body: { userId } → { tempPassword }
GET    /api/portal/tenants/:id/config   Tenant config overrides (secrets masked as null)
PUT    /api/portal/tenants/:id/config/:key   Upsert tenant config
DELETE /api/portal/tenants/:id/config/:key   Remove override

GET    /api/portal/config/platform      All platform config (secrets masked)
PUT    /api/portal/config/platform/:key  (OWNER only)
DELETE /api/portal/config/platform/:key  (OWNER only)
POST   /api/portal/config/test-smtp

GET    /api/portal/analytics/overview   { totalTenants, activeTenants, trialTenants, suspendedTenants, newThisMonth, totalStudents }
GET    /api/portal/analytics/growth     Query: months=12 → [{ month, plan, count }]
GET    /api/portal/analytics/plans      [{ plan, count }]
GET    /api/portal/analytics/expiring   Query: days=14 → expiring tenants

GET    /api/portal/audit                Query: page, limit, superAdminId, action, tenantId, from, to

GET    /api/portal/admins               (OWNER only)
POST   /api/portal/admins               (OWNER only) Body: { name, email, password, role }
PATCH  /api/portal/admins/:id/role      (OWNER only)
DELETE /api/portal/admins/:id           (OWNER only)
```

**Public Tenant Config** (no auth):
```
GET    /api/tenant/config?slug={slug}
→ { id, name, slug, logo, logoInitials, primaryColor, accentColor, contactEmail, subscriptionStatus, features: { qrAttendance, assignments, fees, studyMaterials, announcements, videos } }
```

### 1.2 Auth Token Format

Portal JWT payload (signed with `SUPER_ADMIN_JWT_SECRET`, NOT `JWT_SECRET`):
```json
{ "id": 1, "email": "owner@cipherlearn.com", "role": "OWNER", "type": "superadmin" }
```

Store as `portalToken` in `localStorage` — SEPARATE from tenant `token`.

All portal API requests: `Authorization: Bearer <portalToken>`

---

## 2. What You Need to Build

A **standalone Next.js app** (separate repo, separate Vercel deployment) at `portal.cipherlearn.com`.

### 2.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Font | Plus Jakarta Sans (same as main frontend) |
| State / API | Redux Toolkit + RTK Query |
| Forms | react-hook-form + zod |
| UI | Radix UI primitives (same shadcn pattern) |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | sonner |
| Auth | Portal JWT (separate from tenant JWT) |

**Do NOT use:** next-auth, MUI, Chakra, Ant Design, external state management.

### 2.2 Project Structure

```
portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Root (font, providers, theme)
│   │   ├── globals.css              ← Same design tokens as main frontend
│   │   ├── (auth)/
│   │   │   ├── layout.tsx           ← Centered card, no sidebar
│   │   │   └── login/page.tsx
│   │   └── (portal)/
│   │       ├── layout.tsx           ← Sidebar + TopBar layout
│   │       ├── dashboard/page.tsx
│   │       ├── tenants/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx        ← Overview tab
│   │       │       ├── branding/page.tsx
│   │       │       ├── subscription/page.tsx
│   │       │       ├── permissions/page.tsx
│   │       │       ├── environment/page.tsx
│   │       │       ├── users/page.tsx
│   │       │       └── danger/page.tsx
│   │       ├── audit-log/page.tsx
│   │       └── settings/
│   │           ├── page.tsx
│   │           ├── environment/page.tsx
│   │           └── admins/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── tenants/
│   │   │   ├── TenantCard.tsx
│   │   │   ├── TenantStatusBadge.tsx
│   │   │   ├── CreateTenantForm.tsx    ← 4-step wizard
│   │   │   ├── PlanSelector.tsx
│   │   │   ├── QuotaUsageBar.tsx
│   │   │   ├── PermissionsMatrix.tsx
│   │   │   └── FeatureFlagToggles.tsx
│   │   ├── config/
│   │   │   ├── ConfigCard.tsx
│   │   │   ├── ConfigField.tsx
│   │   │   └── ConfigCategorySection.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── TenantGrowthChart.tsx
│   │   │   └── PlanDistributionChart.tsx
│   │   └── ui/                         ← shadcn/radix primitives
│   ├── redux/
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   ├── api/portalApi.ts            ← RTK Query base (auto-injects portal token)
│   │   └── slices/
│   │       ├── auth/authSlice.ts       ← SuperAdmin auth state
│   │       ├── tenants/tenantsApi.ts
│   │       ├── config/configApi.ts
│   │       ├── audit/auditApi.ts
│   │       └── analytics/analyticsApi.ts
│   ├── middleware.ts                   ← Route protection
│   └── types/index.ts
└── package.json
```

---

## 3. Authentication Flow

### 3.1 Login (`POST /api/portal/auth/login`)

```typescript
// Request
{ email: string, password: string }

// Response
{
  success: true,
  data: {
    token: string,          // Portal JWT
    superAdmin: {
      id: number,
      name: string,
      email: string,
      role: "OWNER" | "ADMIN" | "SUPPORT"
    }
  }
}
```

Store `token` as `portalToken` in localStorage. Store `superAdmin` in Redux state.

### 3.2 RTK Query Base Config

```typescript
// src/redux/api/portalApi.ts
const baseUrl = process.env.NEXT_PUBLIC_API_URL; // e.g. http://localhost:5000/api

export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/portal`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
                 || localStorage.getItem("portalToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["TENANTS", "TENANT_DETAIL", "TENANT_USAGE", "CONFIG_PLATFORM", "CONFIG_TENANT", "AUDIT_LOG", "ANALYTICS", "SUPER_ADMINS"],
  endpoints: () => ({}),
});
```

### 3.3 Route Protection (middleware.ts)

```typescript
// Redirect to /login if no portalToken
// Redirect /login → /dashboard if already authenticated
```

### 3.4 Role-Based Access

| Action | OWNER | ADMIN | SUPPORT |
|--------|-------|-------|---------|
| View tenants | ✓ | ✓ | ✓ |
| Create/Edit tenant | ✓ | ✓ | ✗ |
| Suspend/Resume tenant | ✓ | ✓ | ✗ |
| Delete tenant | ✓ | ✗ | ✗ |
| Purge tenant | ✓ | ✗ | ✗ |
| Edit platform config | ✓ | ✗ | ✗ |
| Edit tenant config | ✓ | ✓ | ✗ |
| View audit log | ✓ | ✓ | ✓ |
| Manage SuperAdmins | ✓ | ✗ | ✗ |

---

## 4. Page Specifications

### 4.1 Login Page (`/login`)

- Layout: Full-screen centered two-column (left: branding, right: form)
- Left panel: CipherLearn logo + "Control Plane — Internal Use Only"
- Right panel: email + password form, submit "Sign in to Portal"
- On success → redirect to `/dashboard`
- On error → inline error below form

### 4.2 Dashboard (`/dashboard`)

**KPI Cards (4):**
1. Total Tenants (+ breakdown: active/trial/suspended)
2. Total Students (sum across all tenants)
3. New This Month
4. MRR placeholder (₹ — manual calculation based on plan distribution)

**Charts:**
1. Tenant Growth (AreaChart — monthly new tenants × plan, 12 months from `/api/portal/analytics/growth`)
2. Plan Distribution (DonutChart from `/api/portal/analytics/plans`)

**Expiring Soon:** Tenants from `/api/portal/analytics/expiring?days=14` — show name, plan, days left, "Renew" button

**Recent Activity:** Last 10 entries from `/api/portal/audit?limit=10`

### 4.3 Tenants List (`/tenants`)

**Table columns:**
- Tenant (logoInitials circle + name + slug)
- Plan badge
- Status badge
- Students (n / maxStudents)
- Created (relative date)
- Expires (date or "—")
- Actions ("View" → `/tenants/[id]`)

**Filters:** search input, plan tabs (ALL/FREE/STARTER/PRO/ENTERPRISE), status tabs (ALL/ACTIVE/TRIAL/SUSPENDED/EXPIRED/CANCELLED)

### 4.4 Create Tenant (`/tenants/new`)

**4-step wizard** (state in component, single API call at end):

**Step 1 — Identity:**
- Organization name (required) → auto-generates slug preview
- Slug (validate uniqueness on blur via `GET /api/portal/tenants/slug-check?slug=x`)
- Contact email (required)
- Contact phone (optional)
- Owner name (optional)

Slug rules: 3-50 chars, `a-z0-9-`, no start/end `-`, not in reserved list (`portal`, `api`, `www`, `mail`, `admin`, `app`)

**Step 2 — Plan & Subscription:**
- Plan cards (FREE/STARTER/PRO/ENTERPRISE with feature bullets)
- Trial end date (optional → sets status=TRIAL)
- Subscription end date (optional)
- Quota override accordion (maxStudents, maxBatches, maxTeachers, maxStorageMB)

**Step 3 — Branding (optional):**
- Primary color (hex input + color swatch)
- Accent color
- Logo URL input (or future upload)
- Logo initials (2-char fallback)

**Step 4 — First Admin:**
- Admin name (required)
- Admin email (required)
- Auto-generated temp password (shown once, copy button)
- Send welcome email toggle (UI only — backend sends it)

**Submit:** `POST /api/portal/tenants` with all fields → redirect to `/tenants/[id]`

### 4.5 Tenant Detail (`/tenants/[id]`)

**Header:** tenant name + status badge + quick actions (Suspend/Resume)

**Tab navigation:** Overview | Branding | Subscription | Permissions | Environment | Users | Danger Zone

#### Tab: Overview
- 4 usage bars: Students X/max, Batches X/max, Teachers X/max (data from `GET /api/portal/tenants/:id/usage`)
- Subscription info card (plan, status, dates)
- Activity counts (lectures, tests — can show basic counts)

Usage bar color: green (<80%), amber (80-95%), red (>95%)

#### Tab: Branding
- Name, contact email/phone, address, website — save via `PATCH /api/portal/tenants/:id`
- Primary color, accent color, logo, logoInitials, custom domain — save via `PATCH /api/portal/tenants/:id/branding`

#### Tab: Subscription
- Current plan card + "Change Plan" button → opens plan selector modal
- Plan change modal: 4 plan cards, confirm button
- Quota override section (accordion): Max Students/Batches/Teachers/Storage, override reason, expiry
- Feature flag overrides
- Save via `PATCH /api/portal/tenants/:id/subscription`

#### Tab: Permissions
- Teacher permissions matrix (table of toggles):
  - canManageLectures, canUploadNotes, canUploadVideos, canManageAssignments
  - canViewFees, canManageStudyMaterials, canSendAnnouncements, canViewAnalytics, canExportData
- "Reset to Defaults" button
- Save via `PATCH /api/portal/tenants/:id/permissions`

#### Tab: Environment
Grouped config sections (SMTP, Locale, Integrations, Appearance):
- Each field: label + value (masked if secret) + Edit pencil
- Edit mode: inline input + Save/Cancel
- Secret fields: show `••••••••` after save
- "Clear override" button → `DELETE /api/portal/tenants/:id/config/:key`
- Save via `PUT /api/portal/tenants/:id/config/:key`

#### Tab: Users
- Summary counts: Admins, Teachers, Students
- Table of admin + teacher users (name, email, role, isPasswordSet)
- "Reset Password" button → `POST /api/portal/tenants/:id/users/reset-password` → shows temp password in modal

#### Tab: Danger Zone
All actions require typing tenant slug or "PERMANENTLY DELETE" in confirmation dialog.

| Action | Button | API | Reversible |
|--------|--------|-----|------------|
| Suspend | Red button | `POST /api/portal/tenants/:id/suspend` | Yes |
| Resume | Green button | `POST /api/portal/tenants/:id/resume` | — |
| Cancel | Amber button | `POST /api/portal/tenants/:id/cancel` | 30 days |
| Delete | Red button (type slug) | `DELETE /api/portal/tenants/:id` | 30 days |
| Purge | Red button (OWNER, type "PERMANENTLY DELETE" + 10s countdown) | `DELETE /api/portal/tenants/:id/purge` | **NO** |

### 4.6 Audit Log (`/audit-log`)

- Filters: date range, superAdmin dropdown, action type, tenant search
- Table: timestamp, action badge, performed by, target tenant, IP, expandable JSON details
- Pagination: 50/page

### 4.7 Settings Hub (`/settings`)

Cards linking to:
- Environment Config → `/settings/environment`
- SuperAdmin Management → `/settings/admins`

### 4.8 Platform Config (`/settings/environment`)

Same card layout as tenant Environment tab but:
- Data from `GET /api/portal/config/platform`
- Save via `PUT /api/portal/config/platform/:key` (OWNER only)
- Delete via `DELETE /api/portal/config/platform/:key` (OWNER only)

**Sections:** SMTP, Cloudinary, Auth Settings, Rate Limiting, System

### 4.9 SuperAdmin Management (`/settings/admins`)

- OWNER only (hide from ADMIN/SUPPORT)
- List: name, email, role, createdAt
- "Invite" form: name, email, password, role
- Change role button
- Revoke access button (cannot target self)

---

## 5. Design System

### 5.1 Colors (same as main frontend)

Copy `globals.css` from the main frontend. Add these portal-specific status colors:

```css
/* Status badges */
.status-active    { background: #DCFCE7; color: #16A34A; }
.status-trial     { background: #DBEAFE; color: #2563EB; }
.status-suspended { background: #FEF3C7; color: #D97706; }
.status-expired   { background: #FEE2E2; color: #DC2626; }
.status-cancelled { background: #F3F4F6; color: #6B7280; }

/* Plan badges */
.plan-free       { background: #F3F4F6; color: #6B7280; }
.plan-starter    { background: #DBEAFE; color: #2563EB; }
.plan-pro        { background: #EDE9FE; color: #7C3AED; }
.plan-enterprise { background: #CCFBF1; color: #0F766E; }
```

### 5.2 Component Conventions

- Cards: `rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06)]`
- Danger actions: always in a red-bordered "Danger Zone" section
- Confirmation dialogs: type-to-confirm for destructive actions (never use window.confirm)
- Secret fields: `••••••••` in read mode, empty input in edit mode
- Quota bars: `<QuotaUsageBar>` with green/amber/red threshold coloring
- All forms: react-hook-form + zod validation
- Loading states: skeleton placeholders
- Empty states: icon + title + description + CTA button

### 5.3 Typography (same rules as main frontend)

- Body: 16px min, line-height 1.7
- Small labels: 13px min
- Page titles: `text-2xl font-bold`
- Section headers: `text-lg font-semibold`
- Table headers: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`

---

## 6. Redux State

### 6.1 Auth Slice

```typescript
interface SuperAdminAuthState {
  token: string | null;           // Stored as portalToken in localStorage
  superAdmin: {
    id: number;
    name: string;
    email: string;
    role: "OWNER" | "ADMIN" | "SUPPORT";
  } | null;
  status: "idle" | "authenticated" | "unauthenticated";
}
```

### 6.2 Tag Types

```typescript
tagTypes: [
  "TENANTS",
  "TENANT_DETAIL",
  "TENANT_USAGE",
  "CONFIG_PLATFORM",
  "CONFIG_TENANT",
  "AUDIT_LOG",
  "ANALYTICS",
  "SUPER_ADMINS",
]
```

Invalidation rules:
- Any tenant mutation → invalidate `TENANTS`, `TENANT_DETAIL`, `AUDIT_LOG`, `ANALYTICS`
- Config mutation → invalidate `CONFIG_PLATFORM` or `CONFIG_TENANT`
- Admin mutation → invalidate `SUPER_ADMINS`, `AUDIT_LOG`

---

## 7. Environment Variables (Portal Frontend)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api     # Backend base URL
NEXT_PUBLIC_PORTAL_VERSION=1.0.0
```

---

## 8. Implementation Order

### Phase 1 — Foundation
1. Project setup (Next.js, Tailwind v4, RTK Query, Radix UI)
2. Design tokens (`globals.css`) — copy + extend from main frontend
3. Login page + SuperAdmin auth flow + Redux auth slice
4. Portal layout (Sidebar + TopBar) with role-aware nav
5. RTK Query base config (`portalApi.ts`)
6. Next.js middleware for route protection

### Phase 2 — Tenant Management
7. RTK Query slice: `tenantsApi.ts`
8. Tenants list page (table + filters)
9. Create tenant wizard (4 steps)
10. Tenant detail page shell (tab navigation)
11. Overview tab (usage bars + subscription info)
12. Branding tab

### Phase 3 — Subscription & Permissions
13. Subscription tab (plan change modal + quota overrides)
14. Permissions tab (teacher permissions matrix)
15. Users tab (list + reset password modal)

### Phase 4 — Config & Operations
16. RTK Query slice: `configApi.ts`
17. Environment tab (tenant config with secret masking)
18. Platform config page (`/settings/environment`)
19. Danger zone tab (with confirmation dialogs + purge countdown)

### Phase 5 — Analytics & Audit
20. RTK Query slices: `analyticsApi.ts`, `auditApi.ts`
21. Dashboard (KPI cards + charts)
22. Audit log page
23. SuperAdmin management page

### Phase 6 — Polish
24. Expiring tenants widget on dashboard
25. Slug availability checker
26. All empty states and loading skeletons
27. Mobile responsiveness

---

## 9. Key Implementation Rules

1. **Portal token storage**: `localStorage.getItem("portalToken")` — NOT `localStorage.getItem("token")` (that's the tenant user token)
2. **No tenant context**: Portal routes never send `X-Tenant-Slug` header — they are cross-tenant
3. **Secret fields**: API returns `null` for secret values. Show `••••••••`. On edit, blank input = "no change", non-blank = update.
4. **Purge confirmation**: Requires (a) typing slug, (b) typing "PERMANENTLY DELETE", (c) 10-second countdown. Cannot undo.
5. **Role check**: Disable/hide UI elements for actions the current role can't perform. Never rely solely on backend.
6. **Audit log**: Every mutation automatically creates an audit log entry on the backend. No frontend code needed for this.
7. **Plan change**: Fetch usage first, warn if downgrading would exceed limits — but don't block submission.
8. **SMTP test**: `POST /api/portal/config/test-smtp` sends a test email (backend handles it).
9. **Slug validation**: 3-50 chars, `a-z0-9-` only, not starting/ending with `-`, not reserved.
10. **No billing**: Subscription dates are manually set by SuperAdmin. No payment integration.

---

## 10. What NOT to Do

- Do NOT modify the main `client/` repo (frontend or backend) while building the portal
- Do NOT use `window.confirm()` — always use proper Dialog/AlertDialog components
- Do NOT store secrets in localStorage — only the portal JWT token goes there
- Do NOT skip the confirmation flow for destructive actions
- Do NOT build a public signup flow — tenant creation is SuperAdmin-only
- Do NOT hardcode tenant IDs or slugs anywhere in the portal code
- Do NOT implement payment processing

---

*Last updated: 2026-02-24*
*This document reflects the current state of the main `client/` repo multi-tenant implementation.*
