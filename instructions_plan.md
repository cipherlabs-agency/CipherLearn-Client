# CipherLearn Admin Portal — Claude Implementation Brief

This document is a complete technical brief for Claude to understand, plan, and implement the **CipherLearn Admin Portal** — the internal control plane for managing all tenant instances of the CipherLearn SaaS platform.

Read `CONFIG_PLAN.md` first for the full architecture context.

---

## 1. What We're Building

A **separate Next.js application** at `portal.cipherlearn.com` used exclusively by the CipherLearn team to:

- Create and manage tenant instances (coaching institutes / schools)
- Configure each tenant's plan, features, quotas, and branding
- Manage runtime environment configuration (SMTP, Cloudinary, rate limits, etc.)
- Monitor cross-tenant usage and health
- View a complete audit trail of all admin actions
- Suspend, restore, or purge tenants

This is **not** the tenant dashboard that teachers use. It is the **superadmin control plane** that we (the CipherLearn team) use.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Same as main frontend |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | Same design tokens as main app |
| Font | Plus Jakarta Sans | Same as main frontend |
| State / API | Redux Toolkit + RTK Query | Same pattern as main frontend |
| Forms | react-hook-form + zod | Validation on all create/edit forms |
| UI Primitives | Radix UI (via shadcn pattern) | Accessible components |
| Charts | Recharts | Same as main frontend |
| Icons | lucide-react | Same as main frontend |
| Toasts | sonner | Same as main frontend |
| Auth | Separate SuperAdmin JWT | Different from tenant JWT |
| Hosting | Vercel | Separate project from main frontend |

**Do NOT use:**
- Any external component libraries (MUI, Chakra, Ant Design)
- `next-auth` — we roll our own JWT auth
- Any external state management other than RTK Query

---

## 3. Project Structure

```
portal/                              ← Root of Admin Portal Next.js app
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Root layout (font, providers, theme)
│   │   ├── globals.css              ← Same design tokens as main frontend
│   │   ├── (auth)/
│   │   │   ├── layout.tsx           ← Centered card layout, no sidebar
│   │   │   └── login/
│   │   │       └── page.tsx         ← SuperAdmin login page
│   │   └── (portal)/
│   │       ├── layout.tsx           ← Portal layout: Sidebar + TopBar
│   │       ├── dashboard/
│   │       │   └── page.tsx         ← Overview metrics
│   │       ├── tenants/
│   │       │   ├── page.tsx         ← Tenant list
│   │       │   ├── new/
│   │       │   │   └── page.tsx     ← Create tenant wizard
│   │       │   └── [id]/
│   │       │       ├── page.tsx     ← Tenant detail (tabs)
│   │       │       ├── branding/
│   │       │       │   └── page.tsx
│   │       │       ├── subscription/
│   │       │       │   └── page.tsx
│   │       │       ├── permissions/
│   │       │       │   └── page.tsx
│   │       │       ├── environment/
│   │       │       │   └── page.tsx
│   │       │       ├── users/
│   │       │       │   └── page.tsx
│   │       │       └── danger/
│   │       │           └── page.tsx
│   │       ├── audit-log/
│   │       │   └── page.tsx         ← All admin actions
│   │       └── settings/
│   │           ├── page.tsx         ← Portal settings hub
│   │           ├── environment/
│   │           │   └── page.tsx     ← Global platform config
│   │           └── admins/
│   │               └── page.tsx     ← SuperAdmin management
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          ← Portal sidebar nav
│   │   │   └── TopBar.tsx           ← Portal top bar (breadcrumb + user)
│   │   ├── tenants/
│   │   │   ├── TenantCard.tsx       ← Card in tenant list
│   │   │   ├── TenantStatusBadge.tsx
│   │   │   ├── CreateTenantForm.tsx ← Multi-step wizard
│   │   │   ├── PlanSelector.tsx     ← Plan tier picker
│   │   │   ├── QuotaUsageBar.tsx    ← Progress bar for quota
│   │   │   ├── PermissionsMatrix.tsx ← Teacher permissions toggle grid
│   │   │   └── FeatureFlagToggles.tsx
│   │   ├── config/
│   │   │   ├── ConfigCard.tsx       ← Grouped config key-value display
│   │   │   ├── ConfigField.tsx      ← Individual field (masked secret / plain)
│   │   │   └── ConfigCategorySection.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx       ← KPI stat card
│   │   │   ├── TenantGrowthChart.tsx
│   │   │   └── PlanDistributionChart.tsx
│   │   └── ui/                      ← Shared UI primitives (button, input, etc.)
│   ├── redux/
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   ├── slices/
│   │   │   ├── auth/
│   │   │   │   └── authSlice.ts     ← SuperAdmin auth state
│   │   │   ├── tenants/
│   │   │   │   └── tenantsApi.ts    ← RTK Query: CRUD tenants
│   │   │   ├── config/
│   │   │   │   └── configApi.ts     ← RTK Query: platform + tenant config
│   │   │   ├── audit/
│   │   │   │   └── auditApi.ts      ← RTK Query: audit log
│   │   │   └── analytics/
│   │   │       └── analyticsApi.ts  ← RTK Query: cross-tenant metrics
│   │   └── api/
│   │       └── portalApi.ts         ← RTK Query base config (auto-injects token)
│   ├── middleware.ts                 ← Redirect unauthenticated to /login
│   └── types/
│       └── index.ts                 ← Shared TypeScript types
└── package.json
```

---

## 4. Authentication Flow

### 4.1 SuperAdmin Login

- `POST /api/portal/auth/login` with `{ email, password }`
- Backend validates against `SuperAdmin` table (NOT the `User` table)
- Returns `{ token, superAdmin: { id, name, email, role } }`
- Token signed with `SUPER_ADMIN_JWT_SECRET` (different from tenant `JWT_SECRET`)
- Stored in Redux auth state + `localStorage` (same pattern as main frontend)
- Token payload: `{ id, email, role: 'OWNER'|'ADMIN'|'SUPPORT', type: 'superadmin' }`

### 4.2 Route Protection

```typescript
// portal/src/middleware.ts
// Redirect to /login if no superadmin token in cookie/localStorage
// Redirect /login → /dashboard if already logged in
```

### 4.3 Role-Based Access in Portal

| Portal Action | OWNER | ADMIN | SUPPORT |
|--------------|-------|-------|---------|
| View tenants | ✓ | ✓ | ✓ |
| Create tenant | ✓ | ✓ | ✗ |
| Edit branding/subscription | ✓ | ✓ | ✗ |
| Suspend tenant | ✓ | ✓ | ✗ |
| Delete tenant | ✓ | ✗ | ✗ |
| Purge tenant data | ✓ | ✗ | ✗ |
| Edit global platform config | ✓ | ✗ | ✗ |
| Edit tenant environment config | ✓ | ✓ | ✗ |
| View audit log | ✓ | ✓ | ✓ |
| Manage SuperAdmins | ✓ | ✗ | ✗ |
| Reset tenant admin password | ✓ | ✓ | ✓ |

---

## 5. Page-by-Page Specification

### 5.1 Login Page (`/login`)

**Layout:** Centered card (600px wide), no sidebar
**Left panel:** CipherLearn logo + tagline "CipherLearn Control Plane — Internal Use Only"
**Right panel:** Login form

**Form fields:**
- Email (required)
- Password (required, show/hide toggle)
- Submit: "Sign in to Portal"

**On success:** Redirect to `/dashboard`
**On error:** Inline error message under form ("Invalid credentials")

**Do not add:**
- "Forgot password" (superadmin passwords managed manually)
- "Remember me" checkbox (session expires per JWT expiry)

---

### 5.2 Dashboard Page (`/dashboard`)

**Purpose:** At-a-glance health of the entire platform

**KPI Cards row (4 cards):**
1. **Total Tenants** — count of all non-deleted tenants + breakdown (active / trial / suspended / expired)
2. **Total Students** — sum of students across all active tenants
3. **MRR** — Monthly Recurring Revenue in ₹ (sum of active paid subscriptions)
4. **New This Month** — new tenant signups in current calendar month

**Charts row:**
1. **Tenant Growth Chart** (AreaChart) — monthly new tenants over past 12 months, with separate lines for each plan tier
2. **Plan Distribution** (DonutChart) — breakdown of FREE / STARTER / PRO / ENTERPRISE tenant counts

**Recent Activity section:**
- Last 10 entries from `AdminAuditLog`
- Shows: action type, tenant affected, performed by, timestamp

**Expiring Soon section:**
- Tenants with `subscriptionEndsAt` within the next 14 days
- Sorted by urgency (soonest first)
- "Renew" button links to tenant subscription tab

---

### 5.3 Tenants List Page (`/tenants`)

**Purpose:** Browse and manage all tenant instances

**Header:** "All Tenants" + count badge + "Create New Tenant" primary button

**Filters bar:**
- Search input (searches name, slug, contactEmail)
- Plan filter: ALL | FREE | STARTER | PRO | ENTERPRISE (pill tabs)
- Status filter: ALL | ACTIVE | TRIAL | SUSPENDED | EXPIRED | CANCELLED (pill tabs)

**Table columns:**
| Column | Content |
|--------|---------|
| Tenant | Logo initials + Name + Slug (monospace) |
| Plan | Badge: FREE/STARTER/PRO/ENTERPRISE |
| Status | Status badge (color-coded) |
| Students | n / maxStudents |
| Created | Relative date ("3 days ago") |
| Expires | Date or "—" for non-expiring |
| Actions | "View" button → `/tenants/[id]` |

**Row hover:** Shows quick actions — Suspend / Resume (contextual)

**Empty state:** "No tenants yet. Create your first tenant to get started."

---

### 5.4 Create Tenant Page (`/tenants/new`)

**Layout:** Multi-step wizard (4 steps), full-page card

**Step 1 — Identity:**
- Organization name (required) → auto-generates slug preview
- Slug (required, unique, validated on blur against `GET /api/portal/tenants/slug-check?slug=xyz`)
- Contact email (required)
- Contact phone (optional)
- Owner name (optional)

**Step 2 — Plan & Subscription:**
- Plan selector: 4 plan cards (FREE / STARTER / PRO / ENTERPRISE) with feature bullet points
- Subscription start date (defaults to today)
- Trial end date (optional) — if set, status is TRIAL
- Subscription end date (optional)
- Custom quota overrides (collapsed accordion — "Override default limits"):
  - Max Students, Max Batches, Max Teachers, Max Storage (MB)

**Step 3 — Branding (optional):**
- Primary color picker (hex input + color swatch)
- Accent color picker
- Logo upload (image input → Cloudinary)
- Logo initials (2-char fallback)
- Address, website (optional)

**Step 4 — First Admin User:**
- Admin full name (required)
- Admin email (required) — will receive welcome email
- Temporary password (auto-generated, shown once, copyable)
- "Send welcome email" toggle (default on)

**Submit:** "Create Tenant" → `POST /api/portal/tenants`
**On success:** Redirect to `/tenants/[id]` with success toast "Tenant created successfully"

---

### 5.5 Tenant Detail Page (`/tenants/[id]`)

**Layout:** Page header (tenant name + status badge + quick actions) + tab navigation

**Header quick actions:**
- Suspend button (if ACTIVE/TRIAL) → confirmation dialog → `POST /api/portal/tenants/:id/suspend`
- Resume button (if SUSPENDED) → `POST /api/portal/tenants/:id/resume`
- "View Dashboard →" link → opens `https://[slug].cipherlearn.com` in new tab

#### Tab: Overview

- **Usage meters** (4 progress bars):
  - Students: n / maxStudents
  - Batches: n / maxBatches
  - Teachers: n / maxTeachers
  - Storage: X MB / maxStorageMB
  - Color: green (<80%), amber (80-95%), red (>95%)

- **Activity summary:**
  - Last login (most recent `User` login timestamp for this tenant)
  - Total lectures scheduled
  - Total attendance records
  - Total notes/videos uploaded

- **Subscription info card:**
  - Plan, status, start date, end date
  - Days until expiry (warning if < 14 days)

#### Tab: Branding

- **Org Identity section:**
  - Name, slug (read-only after creation), contact email/phone, address, website
  - All fields editable, "Save Changes" button

- **Visual Branding section:**
  - Primary color (color picker + hex input + live preview swatch)
  - Accent color (same)
  - Logo upload (dropzone or URL input)
  - Logo initials fallback input

- **Custom Domain section:**
  - Current custom domain (if set) with CNAME instructions
  - Input to set/change custom domain
  - DNS verification status badge

**Save:** `PATCH /api/portal/tenants/:id/branding`

#### Tab: Subscription

- **Current Plan card:**
  - Plan name, status, badge
  - Start date, end date, trial end date
  - Inline "Change Plan" button → opens plan selector modal

- **Change Plan Modal:**
  - 4 plan cards (radio select)
  - If downgrading: warning shows current usage vs. new limits
  - Confirm button: "Change to [Plan Name]"

- **Quota Overrides section (accordion):**
  - Toggle "Override default limits"
  - Input fields: Max Students, Max Batches, Max Teachers, Max Storage
  - Override reason textarea (required when overriding)
  - Override expiry date (optional)
  - Shows current overrides vs. plan defaults

- **Feature Flag Overrides (accordion):**
  - Toggle switches for each feature (same as plan flags)
  - Current state vs. plan default shown side-by-side
  - Override reason required

**Save:** `PATCH /api/portal/tenants/:id/subscription`

#### Tab: Permissions

- **Teacher Permissions Matrix:**
  - Table: Permission name | Description | Default (plan) | Override toggle
  - Permissions: `canManageLectures`, `canUploadNotes`, `canUploadVideos`, `canManageAssignments`, `canViewFees`, `canManageStudyMaterials`, `canSendAnnouncements`, `canViewAnalytics`, `canExportData`
  - Each row has a toggle switch
  - "Reset to Defaults" button

- **Save:** `PATCH /api/portal/tenants/:id/permissions`

#### Tab: Environment

- **Config sections (collapsible cards, grouped by category):**

  **SMTP (Email) section:**
  | Key | Label | Type |
  |-----|-------|------|
  | `smtp.host` | Mail Server Host | text |
  | `smtp.port` | Port | number |
  | `smtp.user` | Username | text |
  | `smtp.password` | Password | secret |
  | `smtp.fromName` | From Name | text |
  | `smtp.fromEmail` | From Email | email |

  - Each row shows: label + current value (masked if secret) + "Edit" pencil icon
  - If no tenant override: shows "Using platform default" in muted text
  - Edit mode: inline field + Save/Cancel
  - "Test Email Configuration" button → sends test email to the config's fromEmail

  **Locale section:**
  | Key | Label | Type |
  |-----|-------|------|
  | `timezone` | Timezone | select (IANA timezones) |
  | `locale` | Locale | select |
  | `currency` | Currency Code | text (INR, USD, etc.) |
  | `currencySymbol` | Currency Symbol | text (₹, $, etc.) |
  | `dateFormat` | Date Format | select (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD) |

  **Integrations section:**
  | Key | Label | Type |
  |-----|-------|------|
  | `webhook.url` | Webhook URL | url |
  | `webhook.secret` | Webhook Secret | secret |

  **Appearance Overrides section:**
  | Key | Label | Type |
  |-----|-------|------|
  | `appearance.borderRadius` | Border Radius | text |
  | `appearance.fontFamily` | Font Family | text |

- **Save per field** (each field saves independently via `PUT /api/portal/tenants/:id/config/:key`)
- Secret fields: value shown as `••••••••` after first save, re-entering replaces it

#### Tab: Users

- Summary counts: Admins, Teachers, Students
- Table of admin + teacher Users for this tenant:
  - Name, email, role, last login, status
  - Actions: "Reset Password" (generates temp password + sends email)
- Button: "Add Admin" → form (name, email, temp password)

#### Tab: Danger Zone

All actions require confirmation modal with tenant name typed:

| Action | Trigger | What Happens | Reversible |
|--------|---------|-------------|-----------|
| **Suspend** | "Suspend Tenant" button | Sets status=SUSPENDED, blocks all logins | Yes — Resume |
| **Resume** | "Resume Tenant" button | Sets status=ACTIVE, restores access | — |
| **Cancel** | "Cancel Subscription" button | Sets status=CANCELLED, 30-day grace period | Within 30 days |
| **Delete** | "Delete Tenant" button (requires typing tenant slug) | Soft delete, 30-day retention | Within 30 days |
| **Purge** | "Purge All Data" button (OWNER only) (requires typing "PERMANENTLY DELETE") | Hard deletes ALL data + Cloudinary folder | **NO** |

---

### 5.6 Audit Log Page (`/audit-log`)

**Purpose:** Full history of every action performed by any SuperAdmin

**Filters:**
- Date range picker (from / to)
- SuperAdmin filter (dropdown)
- Action type filter (tenant.create, tenant.suspend, config.update, etc.)
- Target tenant search

**Table columns:**
| Column | Content |
|--------|---------|
| Timestamp | Full datetime + relative ("3h ago") |
| Action | Action type badge (color-coded by category) |
| Performed By | SuperAdmin name + role |
| Target | Tenant name (if applicable) |
| Details | Expandable JSON metadata accordion |
| IP Address | Client IP |

**Pagination:** 50 per page, infinite scroll or numbered pages

---

### 5.7 Settings Pages

#### `/settings` — Hub page
Cards linking to:
- Environment / Platform Config
- SuperAdmin Management
- Portal Appearance
- Danger Zone (global maintenance mode)

#### `/settings/environment` — Global Platform Config

Same card-based layout as tenant environment tab, but for **platform-wide** defaults.

**Sections:**
1. **SMTP (Default)** — platform email server
2. **Cloudinary** — shared file storage credentials
3. **Auth Settings** — JWT expiry, login attempt limits
4. **Rate Limiting** — defaults per plan tier
5. **System** — maintenance mode, support email, Slack webhook

**SMTP Test button** — sends test email to the logged-in superadmin's email

**Maintenance Mode toggle:**
- When enabled: all tenant API requests return 503 with custom message
- The maintenance message is configurable inline
- Warning: "This will block ALL tenant access immediately"

#### `/settings/admins` — SuperAdmin Management (OWNER only)

- List of all SuperAdmins with name, email, role, last login
- "Invite SuperAdmin" button → form: name, email, role selector, temp password
- Revoke access (remove from SuperAdmin table)
- Change role (cannot change own role)

---

## 6. Backend API Endpoints

All portal routes prefixed with `/api/portal/` and protected by `isSuperAdmin` middleware.

### 6.1 Auth

```
POST   /api/portal/auth/login           Body: { email, password }
POST   /api/portal/auth/logout          Blacklists token
GET    /api/portal/auth/me              Returns current superadmin info
```

### 6.2 Tenants

```
GET    /api/portal/tenants              Query: page, limit, search, plan, status
POST   /api/portal/tenants              Create new tenant + first admin user
GET    /api/portal/tenants/:id          Full tenant detail
PATCH  /api/portal/tenants/:id          Update basic info
DELETE /api/portal/tenants/:id          Soft delete

GET    /api/portal/tenants/slug-check   Query: slug → { available: boolean }

PATCH  /api/portal/tenants/:id/branding
PATCH  /api/portal/tenants/:id/subscription  (plan change + quota overrides)
PATCH  /api/portal/tenants/:id/permissions   (teacherPermissions JSON)

POST   /api/portal/tenants/:id/suspend   Body: { reason }
POST   /api/portal/tenants/:id/resume
POST   /api/portal/tenants/:id/cancel
POST   /api/portal/tenants/:id/purge    (OWNER only — requires 2FA confirmation)

GET    /api/portal/tenants/:id/usage    Live quota usage counts
GET    /api/portal/tenants/:id/users    Admin + teacher users

POST   /api/portal/tenants/:id/users/reset-password   Body: { userId }
```

### 6.3 Environment Config

```
GET    /api/portal/config/platform           All platform config keys (secrets masked)
PUT    /api/portal/config/platform/:key      Upsert a platform config value
DELETE /api/portal/config/platform/:key      Reset to env var default

GET    /api/portal/tenants/:id/config        All tenant config overrides
PUT    /api/portal/tenants/:id/config/:key   Upsert tenant config override
DELETE /api/portal/tenants/:id/config/:key   Remove override (revert to platform default)

POST   /api/portal/config/test-smtp          Body: { tenantId? } → sends test email
```

### 6.4 Analytics

```
GET    /api/portal/analytics/overview    KPI counts (tenants, students, MRR)
GET    /api/portal/analytics/growth      Monthly new tenant trend (12 months)
GET    /api/portal/analytics/plans       Plan distribution counts
GET    /api/portal/analytics/expiring    Tenants expiring in N days
```

### 6.5 Audit Log

```
GET    /api/portal/audit                 Query: page, limit, superAdminId, action, tenantId, from, to
```

### 6.6 Settings / SuperAdmins

```
GET    /api/portal/admins                List all superadmins (OWNER only)
POST   /api/portal/admins                Create superadmin (OWNER only)
PATCH  /api/portal/admins/:id/role       Change role (OWNER only)
DELETE /api/portal/admins/:id            Revoke access (OWNER only)
```

---

## 7. Redux State Management

### 7.1 Auth Slice

```typescript
// src/redux/slices/auth/authSlice.ts
interface SuperAdminAuthState {
  token: string | null
  superAdmin: {
    id: number
    name: string
    email: string
    role: 'OWNER' | 'ADMIN' | 'SUPPORT'
  } | null
  isLoading: boolean
}
```

### 7.2 RTK Query Base Config

```typescript
// src/redux/api/portalApi.ts
// Base URL: process.env.NEXT_PUBLIC_API_URL + "/portal"
// Auto-injects Authorization: Bearer <superadmin-token>
// On 401: redirect to /login (different from tenant 401 behavior)
```

### 7.3 Tag Types for Cache Invalidation

```
TENANTS         → invalidated on create/update/delete/suspend/resume
TENANT_DETAIL   → invalidated on any tenant mutation
TENANT_USAGE    → invalidated on tenant data changes
CONFIG_PLATFORM → invalidated on platform config changes
CONFIG_TENANT   → invalidated on tenant config changes
AUDIT_LOG       → invalidated on any mutation (new entries)
ANALYTICS       → invalidated on tenant changes
SUPER_ADMINS    → invalidated on admin management
```

---

## 8. Design System

### 8.1 Colors (same as main frontend)

```css
:root {
  --primary: 171 77% 24%;      /* Deep Teal — primary actions */
  --accent: 38 92% 50%;        /* Amber — warnings, highlights */
  --background: 40 33% 97%;    /* Warm cream */
  --destructive: 0 72% 51%;    /* Red — danger actions */
}
```

### 8.2 Additional Portal-Specific Colors

```css
/* Status badges */
--status-active:    #16A34A;   /* Green */
--status-trial:     #2563EB;   /* Blue */
--status-suspended: #D97706;   /* Amber */
--status-expired:   #DC2626;   /* Red */
--status-cancelled: #6B7280;   /* Gray */

/* Plan badges */
--plan-free:        #6B7280;   /* Gray */
--plan-starter:     #2563EB;   /* Blue */
--plan-pro:         #7C3AED;   /* Purple */
--plan-enterprise:  #0F766E;   /* Teal */
```

### 8.3 Component Conventions

- Cards: `rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06)]`
- Danger actions: always in a separate "Danger Zone" section with red border
- Confirmation dialogs: always require typing a specific string for irreversible actions
- Secrets: displayed as `••••••••` in read mode, text input in edit mode
- Quota bars: use `<QuotaUsageBar>` with green/amber/red threshold coloring
- All forms use react-hook-form + zod for client-side validation
- Loading states: skeleton placeholders matching the expected layout
- Empty states: icon + title + description + CTA button

### 8.4 Typography

- Same as main frontend: Plus Jakarta Sans, 16px base
- Page titles: `text-2xl font-bold`
- Section headers: `text-lg font-semibold`
- Table headers: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Min text: 13px

---

## 9. Key Implementation Notes

### 9.1 Secret Field Handling

When displaying config fields that contain secrets (passwords, API keys):
1. API returns `null` for the value if `isSecret = true`
2. UI shows `••••••••` placeholder
3. Edit mode: empty input (user must re-enter to change)
4. On save: only updates if the field has a non-empty value
5. "Clear" button resets to platform default (for tenant overrides)

### 9.2 Purge Action Safety

The purge action is the most dangerous operation in the system:
1. Requires SuperAdmin role = `OWNER`
2. Shows a full-page confirmation dialog (not just a modal)
3. User must type the exact tenant slug in a text input
4. User must type "PERMANENTLY DELETE" in a second input
5. After confirmation, shows a 10-second countdown before executing
6. The countdown can be cancelled

### 9.3 Tenant Creation Wizard

The create wizard saves progress in component state (not Redux/DB) until final submission. Each step validates its fields before allowing progression to the next step. The "Create Tenant" API call is a single atomic operation:
1. Creates `Tenant` record
2. Creates first `User` (ADMIN role) for that tenant
3. Sends welcome email (if toggled on)
4. Creates `AdminAuditLog` entry
5. Returns full tenant + user details

If the API call fails, nothing is created (transaction).

### 9.4 Slug Validation

Slugs must:
- Be 3-50 characters
- Contain only `a-z`, `0-9`, `-`
- Not start or end with `-`
- Not be a reserved word: `portal`, `api`, `www`, `mail`, `admin`, `app`
- Be globally unique

Validate on blur (after user leaves the field) with a debounced API call.

### 9.5 Plan Change with Usage Validation

When the SuperAdmin changes a tenant's plan to a lower tier, the UI must:
1. Fetch current usage via `GET /api/portal/tenants/:id/usage`
2. Compare against new plan limits
3. If any limit is exceeded: show a clear warning listing exactly what's over limit
4. Do NOT block the UI — show warning but allow saving (backend will reject if truly unsafe)
5. Backend always performs the authoritative validation

---

## 10. Implementation Order

Build in this order to minimize dependencies:

### Phase 1 — Foundation
1. Project setup (Next.js, Tailwind, RTK Query, shadcn/radix primitives)
2. Design tokens (`globals.css`) — copy from main frontend
3. Login page + SuperAdmin auth flow
4. Portal layout (Sidebar + TopBar)
5. RTK Query base config (`portalApi.ts`)
6. Redux auth slice

### Phase 2 — Tenant Management Core
7. Tenants list page (table + filters)
8. Tenant detail page shell (tabs navigation)
9. Overview tab (usage meters + subscription info)
10. Branding tab (edit form)
11. Subscription tab (plan change + quota overrides)
12. Create tenant wizard

### Phase 3 — Permissions & Config
13. Permissions tab (teacher permissions matrix)
14. Environment tab (tenant config editor with secrets)
15. Global platform config page (`/settings/environment`)
16. Users tab (list + reset password)

### Phase 4 — Operations
17. Danger zone tab (suspend/resume/delete/purge)
18. Audit log page
19. Dashboard (KPI cards + charts)
20. SuperAdmin management page

### Phase 5 — Polish
21. Expiring tenants alerts on dashboard
22. SMTP test functionality
23. Slug availability checker
24. All empty states and loading skeletons
25. Mobile responsiveness (sidebar collapses to hamburger)

---

## 11. What NOT to Do

- Do NOT modify the main CipherLearn frontend (`frontend/` directory) while building the portal
- Do NOT touch backend logic beyond adding `portal/` routes — existing routes stay unchanged
- Do NOT use window.confirm() — always use proper Dialog components for confirmations
- Do NOT store secrets in plaintext in localStorage — only the JWT token goes in localStorage
- Do NOT hardcode tenant IDs or slugs
- Do NOT skip the audit log — every mutation must create an `AdminAuditLog` entry
- Do NOT implement billing/payment processing — subscription management is manual (admin sets dates)
- Do NOT build a public signup flow — tenants are created exclusively by SuperAdmins

---

## 12. Backend Module Structure (portal/)

New module to be created at `backend/src/modules/portal/`:

```
portal/
├── auth/
│   ├── controller.ts   ← login, logout, me
│   ├── service.ts      ← validate superadmin credentials, issue JWT
│   ├── middleware.ts   ← isSuperAdmin(roles: SuperAdminRole[])
│   └── route.ts
├── tenants/
│   ├── controller.ts   ← CRUD + suspend/resume/cancel/purge
│   ├── service.ts      ← business logic + quota enforcement + audit logging
│   ├── validation.ts   ← Joi schemas for all inputs
│   └── route.ts
├── config/
│   ├── controller.ts   ← platform + tenant config CRUD
│   ├── service.ts      ← AES encryption/decryption, config resolution
│   └── route.ts
├── analytics/
│   ├── controller.ts   ← cross-tenant aggregate queries
│   ├── service.ts      ← metrics, growth data
│   └── route.ts
├── audit/
│   ├── controller.ts   ← read audit log
│   ├── service.ts      ← query + filter audit entries
│   └── route.ts
├── admins/
│   ├── controller.ts   ← superadmin CRUD
│   ├── service.ts
│   └── route.ts
└── index.ts            ← mounts all portal sub-routes at /api/portal
```

Each portal service method must call `auditService.log(superAdminId, action, targetType, targetId, metadata)` for all write operations.

---

## 13. Environment Variables Needed

```bash
# Existing backend env vars (already in .env)
APP_PORT=5000
DB_URL=postgresql://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# New env vars to add
SUPER_ADMIN_JWT_SECRET=...        # Different from JWT_SECRET — never share
ENCRYPTION_KEY=...                 # 32-byte hex string for AES-256 config encryption
ADMIN_PORTAL_URL=https://portal.cipherlearn.com  # For CORS

# Portal frontend env
NEXT_PUBLIC_API_URL=https://api.cipherlearn.com/api
NEXT_PUBLIC_PORTAL_VERSION=1.0.0
```

---

*Last updated: 2026-02-19*
*This document is the authoritative brief for building the CipherLearn Admin Portal.*
