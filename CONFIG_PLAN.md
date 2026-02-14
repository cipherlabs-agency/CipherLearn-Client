# CONFIG_PLAN.md

# CipherLearn — Multi-Tenant SaaS Configuration Plan

This document defines how CipherLearn transforms from a single-class deployment into a configurable, multi-tenant SaaS platform managed through a central Admin Portal.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tenant Model & Database Changes](#2-tenant-model--database-changes)
3. [Per-Tenant Configuration Surface](#3-per-tenant-configuration-surface)
4. [Backend Changes](#4-backend-changes)
5. [Frontend Changes](#5-frontend-changes)
6. [Admin Portal (CipherLearn Control Plane)](#6-admin-portal-cipherlearn-control-plane)
7. [Authentication & Authorization Changes](#7-authentication--authorization-changes)
8. [File Storage Isolation](#8-file-storage-isolation)
9. [Email & Notification Branding](#9-email--notification-branding)
10. [Hosting & Infrastructure](#10-hosting--infrastructure)
11. [Cost Breakdown](#11-cost-breakdown)
12. [Migration Strategy for Existing Data](#12-migration-strategy-for-existing-data)
13. [Security Considerations](#13-security-considerations)
14. [Implementation Phases](#14-implementation-phases)

---

## 1. Architecture Overview

### Current (Single-Tenant)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend    │────▶│  Backend    │────▶│  Database   │
│  (Vercel)   │     │  (Render)   │     │  (Aiven PG) │
│  One class  │     │  One API    │     │  One DB     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Target (Multi-Tenant SaaS)
```
                    ┌──────────────────────────────────────┐
                    │  CipherLearn Admin Portal            │
                    │  portal.cipherlearn.com              │
                    │  Create / Suspend / Renew / Delete   │
                    └──────────────┬───────────────────────┘
                                   │ manages
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
  ┌─────▼──────┐           ┌──────▼─────┐           ┌───────▼────┐
  │  Tenant A  │           │  Tenant B  │           │  Tenant C  │
  │  xyz.cl.com│           │  abc.cl.com│           │  pqr.cl.com│
  └────────────┘           └────────────┘           └────────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Shared Infrastructure       │
                    │  ┌────────┐ ┌─────────────┐ │
                    │  │Frontend│ │   Backend    │ │
                    │  │Vercel  │ │  Railway     │ │
                    │  └────────┘ └──────┬──────┘ │
                    │             ┌──────▼──────┐ │
                    │             │  Neon PG    │ │
                    │             │ Row-Level   │ │
                    │             │ Isolation   │ │
                    │             └─────────────┘ │
                    └─────────────────────────────┘
```

**Approach: Row-Level Multi-Tenancy**
- Single database, single deployment
- Every table has a `tenantId` column
- Prisma middleware auto-filters all queries by `tenantId`
- Tenant resolved from subdomain or JWT
- One update deploys to all tenants instantly

---

## 2. Tenant Model & Database Changes

### 2.1 New Models

```prisma
model Tenant {
  id                  Int       @id @default(autoincrement())
  name                String                        // "XYZ Coaching Classes"
  slug                String    @unique             // "xyz-coaching" → xyz-coaching.cipherlearn.com
  customDomain        String?   @unique             // "app.xyzcoaching.in" (optional)

  // Branding
  logo                String?                       // Cloudinary URL
  logoInitials        String?                       // "XY" (fallback when no logo)
  primaryColor        String?   @default("#4f46e5") // Indigo default
  accentColor         String?   @default("#14b8a6") // Teal default

  // Organization info
  ownerName           String?
  contactEmail        String
  contactPhone        String?
  address             String?
  website             String?

  // Subscription
  plan                TenantPlan       @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(ACTIVE)
  subscriptionStartAt DateTime?
  subscriptionEndsAt  DateTime?
  trialEndsAt         DateTime?

  // Quotas (overridable per plan)
  maxStudents         Int       @default(50)
  maxBatches          Int       @default(3)
  maxTeachers         Int       @default(2)
  maxStorageMB        Int       @default(500)

  // Feature flags
  featureQRAttendance Boolean   @default(true)
  featureAssignments  Boolean   @default(true)
  featureFees         Boolean   @default(true)
  featureStudyMaterials Boolean @default(true)
  featureAnnouncements Boolean  @default(true)
  featureVideos       Boolean   @default(true)

  // Audit
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  suspendedAt         DateTime?
  deletedAt           DateTime?
  suspendedReason     String?

  // Relations (every existing model gets a tenantId FK)
  users               User[]
  students            Student[]
  batches             Batch[]
  attendances         Attendance[]
  attendanceSheets    AttendanceSheet[]
  qrAttendanceTokens  QRAttendanceToken[]
  notes               Note[]
  youtubeVideos       YoutubeVideo[]
  assignmentSlots     AssignmentSlot[]
  studentSubmissions  StudentSubmission[]
  announcements       Announcement[]
  studyMaterials      StudyMaterial[]
  feeStructures       FeeStructure[]
  feeReceipts         FeeReceipt[]

  @@index([slug])
  @@index([customDomain])
  @@index([subscriptionStatus])
  @@map("tenants")
}

enum TenantPlan {
  FREE        // 50 students, 3 batches, 2 teachers, 500MB
  STARTER     // 200 students, 10 batches, 5 teachers, 2GB
  PRO         // 1000 students, 50 batches, 20 teachers, 10GB
  ENTERPRISE  // Unlimited
}

enum SubscriptionStatus {
  ACTIVE
  TRIAL
  SUSPENDED
  CANCELLED
  EXPIRED
}

// Super-admin users for the CipherLearn Admin Portal
model SuperAdmin {
  id          Int       @id @default(autoincrement())
  name        String
  email       String    @unique
  password    String
  role        SuperAdminRole @default(SUPPORT)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("super_admins")
}

enum SuperAdminRole {
  OWNER       // CipherLearn founders — full access
  ADMIN       // Can create/suspend/delete tenants
  SUPPORT     // Read-only + can reset passwords
}

// Audit log for admin portal actions
model AdminAuditLog {
  id          Int       @id @default(autoincrement())
  superAdminId Int
  action      String                // "tenant.create", "tenant.suspend", "tenant.delete"
  targetType  String                // "tenant", "user"
  targetId    Int
  metadata    Json?                 // Additional context
  ipAddress   String?
  createdAt   DateTime  @default(now())

  @@index([superAdminId])
  @@index([targetType, targetId])
  @@map("admin_audit_logs")
}
```

### 2.2 Changes to ALL Existing Models

Every existing model gets a `tenantId` column and a relation to `Tenant`:

| Model | Add Column | Unique Constraint Change | Index Change |
|-------|-----------|------------------------|-------------|
| **User** | `tenantId Int` | `@@unique([email])` → `@@unique([tenantId, email])` | Add `@@index([tenantId])` |
| **Student** | `tenantId Int` | `@@unique([email])` → `@@unique([tenantId, email])` | Add `@@index([tenantId])` |
| **Batch** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **Attendance** | `tenantId Int` | `@@unique([studentId, date, batchId])` → `@@unique([tenantId, studentId, date, batchId])` | Update existing indexes |
| **AttendanceSheet** | `tenantId Int` | `@@unique([batchId, year, month])` → `@@unique([tenantId, batchId, year, month])` | — |
| **QRAttendanceToken** | `tenantId Int` | `@@unique([batchId, date])` → `@@unique([tenantId, batchId, date])` | — |
| **YoutubeVideo** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **Note** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **AssignmentSlot** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **StudentSubmission** | `tenantId Int` | `@@unique([slotId, studentId])` → `@@unique([tenantId, slotId, studentId])` | — |
| **Announcement** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **StudyMaterial** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **FeeStructure** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **FeeReceipt** | `tenantId Int` | Receipt number: `{tenantSlug}-RCP-YYYY-NNNNN` | Add `@@index([tenantId])` |
| **PasswordResetToken** | — | No change (linked via userId) | — |
| **TokenBlacklist** | `tenantId Int` | — | Add `@@index([tenantId])` |
| **LoginAttempt** | `tenantId Int?` | — | Add `@@index([tenantId])` |

---

## 3. Per-Tenant Configuration Surface

This is everything an admin configures when creating or editing a tenant through the Admin Portal.

### 3.1 Identity & Branding

| Config | Field | Example | Where It Appears |
|--------|-------|---------|-----------------|
| Class Name | `tenant.name` | "Shree Academy" | Sidebar, Navbar, Auth pages, Emails, Tab title |
| URL Slug | `tenant.slug` | "shree-academy" | `shree-academy.cipherlearn.com` |
| Custom Domain | `tenant.customDomain` | "app.shreeacademy.in" | DNS CNAME → Vercel |
| Logo | `tenant.logo` | Cloudinary URL | Sidebar, Navbar, Auth pages, Emails |
| Logo Initials | `tenant.logoInitials` | "SA" | Fallback when logo not uploaded |
| Primary Color | `tenant.primaryColor` | "#4f46e5" | Auth page accent, buttons, links |
| Accent Color | `tenant.accentColor` | "#14b8a6" | Auth page decoration blobs |

### 3.2 Organization Details

| Config | Field | Purpose |
|--------|-------|---------|
| Owner Name | `tenant.ownerName` | Displayed in emails, invoices |
| Contact Email | `tenant.contactEmail` | Support contact, email sender |
| Contact Phone | `tenant.contactPhone` | Displayed in app footer |
| Address | `tenant.address` | Invoices, footer |
| Website | `tenant.website` | Links in emails |

### 3.3 Subscription & Quotas

| Config | Field | FREE | STARTER | PRO | ENTERPRISE |
|--------|-------|------|---------|-----|-----------|
| Max Students | `maxStudents` | 50 | 200 | 1,000 | Unlimited |
| Max Batches | `maxBatches` | 3 | 10 | 50 | Unlimited |
| Max Teachers | `maxTeachers` | 2 | 5 | 20 | Unlimited |
| Max Storage | `maxStorageMB` | 500 | 2,048 | 10,240 | Unlimited |
| QR Attendance | `featureQRAttendance` | Yes | Yes | Yes | Yes |
| Assignments | `featureAssignments` | No | Yes | Yes | Yes |
| Fee Management | `featureFees` | No | Yes | Yes | Yes |
| Study Materials | `featureStudyMaterials` | No | Yes | Yes | Yes |
| Announcements | `featureAnnouncements` | Yes | Yes | Yes | Yes |
| Video Lectures | `featureVideos` | No | Yes | Yes | Yes |

### 3.4 Subscription Lifecycle

```
                    Admin Portal Action
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
  CREATE               SUSPEND               DELETE
     │                     │                     │
     ▼                     ▼                     ▼
  TRIAL ──expires──▶ EXPIRED          SUSPENDED ──grace──▶ DATA PURGE
     │                     │               │
  payment              payment          payment
     │                     │               │
     ▼                     ▼               ▼
  ACTIVE ──────────▶ EXPIRED ◀──── ACTIVE (restored)
     │
  cancel
     │
     ▼
  CANCELLED ──30 days──▶ DATA PURGE
```

**What happens in each state:**

| Status | Dashboard Access | App Access | Data | Admin Portal |
|--------|-----------------|-----------|------|-------------|
| ACTIVE | Full | Full | Retained | Full control |
| TRIAL | Full (limited features) | Full | Retained | Upgrade prompts |
| SUSPENDED | Read-only banner | Blocked with message | Retained | Resume/Delete |
| EXPIRED | Blocked with renewal page | Blocked with message | Retained 30 days | Renew/Delete |
| CANCELLED | Blocked | Blocked | Retained 30 days then purged | Reactivate |

---

## 4. Backend Changes

### 4.1 Tenant Resolution Middleware

New file: `backend/src/middleware/tenantContext.ts`

Extracts `tenantId` from the incoming request using this priority:

```
1. JWT payload → decoded.tenantId (authenticated requests)
2. Subdomain → "shree-academy" from shree-academy.cipherlearn.com
3. Custom domain → lookup tenant by domain header
4. X-Tenant-Slug header → fallback for API clients
```

Attaches to `req.tenant` and `req.tenantId`. Rejects if:
- Tenant not found → 404
- Tenant suspended → 403 with message "Your subscription is suspended. Contact support."
- Tenant expired → 403 with message "Your subscription has expired. Please renew."

### 4.2 Prisma Tenant Filter Middleware

New file: `backend/src/middleware/prismaTenantFilter.ts`

Uses Prisma `$extends` to automatically inject `where: { tenantId }` into every query:

```typescript
const prismaWithTenant = (tenantId: number) =>
  prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
```

This ensures **no service file can accidentally forget to filter by tenant**.

### 4.3 Service Layer Changes

Every service method currently takes `(data)` — it will now receive `tenantId` automatically from `req.tenantId` via the controller. The Prisma tenant middleware handles the actual filtering, so service code changes are minimal:

**Example — Batch Service (before):**
```typescript
async getAll() {
  return prisma.batch.findMany({ where: { isDeleted: false } });
}
```

**After (automatic via middleware — no code change needed in service):**
```typescript
// Prisma middleware auto-injects: where: { tenantId: req.tenantId, isDeleted: false }
async getAll() {
  return prisma.batch.findMany({ where: { isDeleted: false } });
}
```

The controller passes the tenant-scoped Prisma client to the service.

### 4.4 Files Modified

| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Add Tenant model, tenantId to all models, update unique constraints |
| `backend/src/middleware/tenantContext.ts` | **NEW** — Tenant resolution middleware |
| `backend/src/middleware/prismaTenantFilter.ts` | **NEW** — Auto-filter Prisma queries |
| `backend/src/server.ts` | Add tenant middleware, dynamic CORS |
| `backend/src/config/env.config.ts` | Add `SUPER_ADMIN_EMAILS`, `DEFAULT_TENANT_SLUG` |
| `backend/src/modules/auth/utils.auth.ts` | Include `tenantId` in JWT payload |
| `backend/src/modules/auth/middleware.ts` | Validate user belongs to tenant |
| `backend/src/modules/auth/service.auth.ts` | Tenant-scoped admin check |
| `backend/src/modules/app/auth/service.ts` | Tenant-scoped login/signup |
| `backend/src/modules/dashboard/*/service.ts` | Use tenant-scoped Prisma client (11 service files) |
| `backend/src/modules/dashboard/fees/service.ts` | Tenant-prefixed receipt numbers |
| `backend/src/config/cloudinairy.config.ts` | Tenant-scoped upload folders |
| `backend/src/middleware/rateLimiter.ts` | Tenant-scoped rate limit keys |
| `backend/src/utils/tokenCleanup.ts` | No change needed (cleans by expiry) |

### 4.5 New Backend Module: Tenant Management

New directory: `backend/src/modules/portal/`

```
portal/
├── tenant/
│   ├── controller.ts    # CRUD tenants
│   ├── service.ts       # Business logic + quota enforcement
│   ├── route.ts         # Routes protected by SuperAdmin auth
│   ├── validation.ts    # Joi schemas
│   └── types.ts
├── super-auth/
│   ├── controller.ts    # SuperAdmin login
│   ├── service.ts       # SuperAdmin auth logic
│   ├── route.ts
│   └── middleware.ts     # isSuperAdmin, isSuperOwner
├── analytics/
│   ├── controller.ts    # Cross-tenant metrics
│   └── service.ts       # Revenue, active tenants, usage
└── routes.ts            # /api/portal/*
```

---

## 5. Frontend Changes

### 5.1 Tenant Config Provider

New file: `frontend/src/context/TenantConfig.tsx`

Fetches tenant branding from a public API endpoint (`GET /api/tenant/config?slug=xyz`) on app load. Provides tenant config to all components via React Context.

```typescript
interface TenantConfig {
  id: number;
  name: string;               // "Shree Academy"
  slug: string;               // "shree-academy"
  logo: string | null;        // Cloudinary URL
  logoInitials: string;       // "SA"
  primaryColor: string;       // "#4f46e5"
  accentColor: string;        // "#14b8a6"
  contactEmail: string;
  features: {
    qrAttendance: boolean;
    assignments: boolean;
    fees: boolean;
    studyMaterials: boolean;
    announcements: boolean;
    videos: boolean;
  };
}
```

### 5.2 Branding Touchpoints to Replace

Currently hardcoded "CipherLearn" in 4 locations. All will read from `TenantConfig`:

| Location | Current Value | Replacement |
|----------|--------------|-------------|
| `app/layout.tsx` line 10 | `title: "CipherLearn - Smart Tuition Management"` | `title: "${tenant.name} - Smart Tuition Management"` (dynamic metadata) |
| `components/layout/Sidebar.tsx` line 80 | `CL` / `CipherLearn` | `tenant.logoInitials` / `tenant.name` (or `<img>` if logo exists) |
| `components/layout/Navbar.tsx` line 14 | `CL` / `CipherLearn` | Same as Sidebar |
| `app/(auth)/layout.tsx` lines 20-39 | `CipherLearn`, testimonial, copyright | `tenant.name`, configurable testimonial |

### 5.3 Auth Pages Color Replacement

Currently uses hardcoded Tailwind classes. Will be replaced with CSS variables injected from tenant config:

| Current (hardcoded) | Replacement |
|---------------------|-------------|
| `bg-indigo-600` (icon) | `style={{ backgroundColor: tenant.primaryColor }}` |
| `bg-indigo-500 blur-[100px]` (blob) | `style={{ backgroundColor: tenant.primaryColor }}` |
| `bg-teal-500 blur-[100px]` (blob) | `style={{ backgroundColor: tenant.accentColor }}` |
| `text-indigo-600` (checkbox) | CSS variable `--tenant-primary` |

### 5.4 Tenant Resolution in Frontend

In `frontend/src/app/layout.tsx` (root layout):

```
1. Read hostname from window.location or headers
2. Extract slug from subdomain: "shree-academy" from shree-academy.cipherlearn.com
3. Fetch GET /api/tenant/config?slug=shree-academy (public, no auth needed)
4. Store in TenantConfig context
5. Apply CSS variables for colors
6. If tenant not found → show "Organization not found" page
7. If tenant suspended → show "Subscription suspended" page
```

### 5.5 Sidebar Feature Gating

Sidebar nav items will be conditionally rendered based on `tenant.features`:

```typescript
// Current: all items always shown
{ href: "/fees", label: "Fees", icon: Receipt }

// After: gated by tenant feature flag
tenant.features.fees && { href: "/fees", label: "Fees", icon: Receipt }
```

Hidden features for a tenant:
- Sidebar link hidden
- Route returns "Feature not available on your plan" if accessed directly
- Backend rejects API calls for disabled features

### 5.6 Frontend API Header

`frontend/src/redux/api/api.ts` — Already sends Bearer token. The JWT now contains `tenantId`, so no extra header needed for authenticated requests. For the initial config fetch (before login), the slug from the subdomain is used.

### 5.7 Files Modified

| File | Change |
|------|--------|
| `frontend/src/context/TenantConfig.tsx` | **NEW** — Tenant config context provider |
| `frontend/src/app/layout.tsx` | Wrap with TenantConfigProvider, dynamic metadata |
| `frontend/src/app/(auth)/layout.tsx` | Replace hardcoded branding with tenant config |
| `frontend/src/components/layout/Sidebar.tsx` | Dynamic name/logo, feature-gated nav items |
| `frontend/src/components/layout/Navbar.tsx` | Dynamic name/logo |
| `frontend/src/redux/slices/auth/authSlice.ts` | Add `tenantId` to AuthUser |
| `frontend/src/app/globals.css` | Add `--tenant-primary`, `--tenant-accent` variables |

---

## 6. Admin Portal (CipherLearn Control Plane)

### 6.1 What It Is

A separate frontend application (or route group) at `portal.cipherlearn.com` for CipherLearn team to manage all tenant instances.

### 6.2 Portal Pages

```
portal.cipherlearn.com/
├── /login                          # SuperAdmin login
├── /dashboard                      # Overview metrics
│   ├── Total tenants (active/trial/suspended)
│   ├── Total students across all tenants
│   ├── MRR (Monthly Recurring Revenue)
│   └── Growth chart
├── /tenants                        # Tenant list
│   ├── Search, filter by status/plan
│   ├── Create new tenant
│   └── Bulk actions (suspend, export)
├── /tenants/:id                    # Single tenant detail
│   ├── Overview tab (usage, quota, health)
│   ├── Branding tab (name, logo, colors, domain)
│   ├── Subscription tab (plan, dates, payment history)
│   ├── Users tab (admins, teachers, students count)
│   ├── Settings tab (feature flags, quotas)
│   └── Danger Zone (suspend, delete, purge data)
├── /audit-log                      # All admin actions
└── /settings                       # Portal settings, SuperAdmin management
```

### 6.3 Portal Actions

| Action | What Happens | Reversible? |
|--------|-------------|------------|
| **Create Tenant** | New row in `tenants` table, first admin user created, welcome email sent | Yes |
| **Suspend Tenant** | `subscriptionStatus = SUSPENDED`, all logins blocked, dashboard shows banner | Yes — Resume |
| **Resume Tenant** | `subscriptionStatus = ACTIVE`, access restored | — |
| **Change Plan** | Update quotas, enable/disable features, pro-rate billing | Yes |
| **Renew Subscription** | Extend `subscriptionEndsAt`, set status ACTIVE | — |
| **Delete Tenant** | Soft delete, 30-day grace period, data retained | Yes within 30 days |
| **Purge Tenant** | Hard delete ALL tenant data, Cloudinary folder deleted | **No — Irreversible** |
| **Reset Admin Password** | Generate temp password, email to tenant admin | — |
| **Override Quota** | Manually set maxStudents/maxBatches beyond plan limits | Yes |
| **Transfer Ownership** | Change tenant owner admin | — |

### 6.4 Portal Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js (separate app or monorepo package) | Same stack, shared components |
| Auth | Separate SuperAdmin JWT (different secret) | Isolated from tenant auth |
| API | Same Express backend, `/api/portal/*` routes | No separate backend needed |
| Hosting | Vercel (free for internal tool) | Low traffic |

---

## 7. Authentication & Authorization Changes

### 7.1 JWT Payload Change

**Current:**
```json
{ "id": 1, "email": "admin@xyz.com", "iat": ..., "exp": ... }
```

**After:**
```json
{ "id": 1, "email": "admin@xyz.com", "tenantId": 5, "role": "ADMIN", "iat": ..., "exp": ... }
```

### 7.2 Auth Middleware Changes

**`isAdmin` middleware — current:**
```typescript
// Checks: user.role === "ADMIN"
```

**After:**
```typescript
// Checks: user.role === "ADMIN" AND user.tenantId === req.tenantId
// A tenant admin CANNOT access another tenant's data
```

### 7.3 Admin Email Check — current problem

**Current (`utils.auth.ts`):**
```typescript
const checkAdminEmail = (email) => {
  const adminEmails = config.APP.ADMIN_EMAILS.split(","); // Hardcoded global list!
  return adminEmails.includes(email);
};
```

**After:**
```typescript
// Remove global admin email list entirely
// Admin status is per-tenant, stored in User.role for that tenant
// The first user created for a tenant is the admin
```

### 7.4 SuperAdmin Auth (Portal)

Completely separate from tenant auth:
- Different JWT secret (`SUPER_ADMIN_JWT_SECRET`)
- Different model (`SuperAdmin` table, not `User`)
- Different middleware (`isSuperAdmin`)
- Different routes (`/api/portal/*`)

---

## 8. File Storage Isolation

### 8.1 Cloudinary Folder Structure

**Current:**
```
cipherlearn/
├── notes/
├── assignments/
└── study-materials/
```

**After:**
```
cipherlearn/
├── tenants/
│   ├── shree-academy/          # tenant.slug
│   │   ├── notes/
│   │   ├── assignments/
│   │   ├── study-materials/
│   │   └── branding/           # logo, favicon
│   ├── abc-classes/
│   │   ├── notes/
│   │   ├── assignments/
│   │   └── ...
│   └── ...
└── portal/                     # Admin portal assets
```

### 8.2 Upload Change

`backend/src/config/cloudinairy.config.ts`:

```typescript
// Current:
uploadDocument(file, folder = "notes")

// After:
uploadDocument(file, folder = `tenants/${tenantSlug}/notes`)
```

### 8.3 Storage Quota Enforcement

Before each upload, check:
```typescript
const currentUsageMB = await getCloudinaryUsage(tenantSlug);
if (currentUsageMB + fileSizeMB > tenant.maxStorageMB) {
  throw new InsufficientQuotaError("Storage limit exceeded");
}
```

---

## 9. Email & Notification Branding

### 9.1 Current Email Templates

- Password reset email: Hardcoded "CipherLearn" branding
- Welcome email: Hardcoded "CipherLearn" branding

### 9.2 After: Tenant-Branded Emails

```
From: "Shree Academy" <noreply@cipherlearn.com>
Subject: Welcome to Shree Academy

┌─────────────────────────────────┐
│  [Shree Academy Logo]           │
│                                 │
│  Hi John,                       │
│  Welcome to Shree Academy!      │
│  Your account has been created. │
│                                 │
│  [Set Your Password]            │
│                                 │
│  ───────────────────────        │
│  Shree Academy                  │
│  123 Main St, City              │
│  support@shreeacademy.in        │
│                                 │
│  Powered by CipherLearn         │
└─────────────────────────────────┘
```

Email template receives `tenant` object and injects: name, logo, colors, contact info. "Powered by CipherLearn" in footer (removable on Enterprise plan).

---

## 10. Hosting & Infrastructure

### 10.1 Recommended Production Stack

| Service | Role | Plan | Cost |
|---------|------|------|------|
| **Vercel** | Frontend hosting | Pro | $20/month |
| **Railway** | Backend API | Starter | $5-15/month (usage-based) |
| **Neon PostgreSQL** | Database | Launch | $19/month (scales automatically) |
| **Cloudinary** | File storage | Free → Plus | $0-49/month |
| **Resend** (or Nodemailer + SMTP) | Email | Free tier | $0-20/month |
| **Vercel** | Admin Portal frontend | Same Pro plan | $0 (additional project) |
| **UptimeRobot** | Monitoring | Free | $0 |

### 10.2 Why This Stack

| Choice | Reason |
|--------|--------|
| **Vercel** over Netlify | Best Next.js support, automatic subdomain routing, edge functions |
| **Railway** over Render | No cold starts, usage-based billing, built-in metrics, PostgreSQL addon available |
| **Neon** over Aiven/Supabase | Serverless Postgres (scales to 0), branching for dev, generous free tier, auto-scaling |
| **Cloudinary** kept | Already integrated, free tier sufficient for early stage |

### 10.3 Domain & Subdomain Setup

```
cipherlearn.com                    → Marketing site
portal.cipherlearn.com             → Admin Portal (Vercel)
*.cipherlearn.com                  → Tenant apps (Vercel wildcard subdomain)
api.cipherlearn.com                → Backend API (Railway custom domain)
```

**Vercel wildcard subdomain:** One Next.js deployment handles all `*.cipherlearn.com` requests. The app reads the subdomain at request time to resolve the tenant.

**Custom domains:** Tenants on PRO/ENTERPRISE can add their own domain (`app.xyzcoaching.in`). They add a CNAME record pointing to `cname.vercel-dns.com`. Vercel handles SSL automatically.

### 10.4 Scaling Path

| Stage | Tenants | Students | Monthly Cost |
|-------|---------|----------|-------------|
| **Launch** | 1-5 | 0-250 | $25-54 |
| **Growth** | 5-20 | 250-2,000 | $54-95 |
| **Scale** | 20-100 | 2,000-20,000 | $95-200 |
| **Enterprise** | 100+ | 20,000+ | $200-500 |

The multi-tenant architecture means costs scale with **total usage**, not per-tenant deployments. Adding a new tenant costs $0 in infrastructure.

---

## 11. Cost Breakdown

### 11.1 Current (Free Tier)

| Item | Cost | Limitation |
|------|------|-----------|
| Vercel Hobby | $0 | Non-commercial, 100GB bandwidth |
| Render Free | $0 | Spins down after 15min, 30-50s cold start |
| Aiven Free | $0 | 1GB storage, limited connections |
| **Total** | **$0/month** | Single tenant, not production-ready |

### 11.2 Minimum Viable Production

| Item | Cost | Gets You |
|------|------|---------|
| Vercel Pro | $20/mo | Commercial use, wildcard subdomains, 1TB bandwidth |
| Railway Starter | ~$5/mo | Always-on API, no cold starts, 8GB RAM |
| Neon Free | $0 | 0.5GB storage, auto-suspend, 190 compute hours |
| Cloudinary Free | $0 | 25GB storage, 25GB bandwidth |
| Domain (.com) | ~$12/year | cipherlearn.com |
| **Total** | **~$26/month** | Supports 10-20 tenants comfortably |

### 11.3 Growth Stage

| Item | Cost | Gets You |
|------|------|---------|
| Vercel Pro | $20/mo | Same |
| Railway Pro | ~$25/mo | More compute, higher limits |
| Neon Launch | $19/mo | 10GB storage, 300 compute hours |
| Cloudinary Plus | $49/mo | 25GB+ storage, transformations |
| Resend Pro | $20/mo | 50k emails/month |
| **Total** | **~$133/month** | Supports 50-100 tenants |

### 11.4 Revenue Model Example

| Plan | Price/month | At 10 clients | At 50 clients |
|------|------------|---------------|---------------|
| FREE | ₹0 | ₹0 | ₹0 |
| STARTER | ₹499 | ₹4,990 | ₹24,950 |
| PRO | ₹1,499 | ₹14,990 | ₹74,950 |
| ENTERPRISE | ₹4,999 | ₹49,990 | ₹2,49,950 |

Even 10 STARTER clients (₹4,990/month ≈ $60) covers the entire infrastructure cost.

---

## 12. Migration Strategy for Existing Data

### 12.1 Steps

```
Step 1: Create migration to add Tenant model
        → npx prisma migrate dev --name add_tenant_model

Step 2: Create a default tenant for existing data
        → INSERT INTO tenants (name, slug, ...) VALUES ('Default', 'default', ...)

Step 3: Add tenantId columns (nullable first)
        → ALTER TABLE users ADD COLUMN tenantId INT
        → (repeat for all 16 tables)

Step 4: Backfill existing data
        → UPDATE users SET tenantId = 1 WHERE tenantId IS NULL
        → (repeat for all tables)

Step 5: Make tenantId NOT NULL
        → ALTER TABLE users ALTER COLUMN tenantId SET NOT NULL

Step 6: Update unique constraints
        → DROP INDEX users_email_key
        → CREATE UNIQUE INDEX users_tenant_email_key ON users(tenantId, email)

Step 7: Add foreign keys
        → ALTER TABLE users ADD FOREIGN KEY (tenantId) REFERENCES tenants(id)
```

### 12.2 Zero-Downtime Migration

- Add columns as nullable first → deploy code that writes tenantId
- Backfill existing rows → make columns NOT NULL
- Deploy tenant middleware → all queries now filtered
- Total: 3 deployments, no downtime

---

## 13. Security Considerations

### 13.1 Data Isolation

| Risk | Mitigation |
|------|-----------|
| Cross-tenant data leak | Prisma `$extends` middleware auto-injects `tenantId` on EVERY query |
| Tenant ID spoofing | `tenantId` comes from JWT (server-signed), not from client headers |
| Admin accessing other tenant | Auth middleware validates `user.tenantId === req.tenantId` |
| Student accessing other tenant | App auth validates student's tenant membership |
| Cloudinary file access | Tenant-scoped folder names, but URLs are public (same as current) |
| SQL injection bypassing tenant filter | Prisma parameterized queries (already safe) |
| SuperAdmin abuse | Audit log for all portal actions |

### 13.2 Tenant Suspension Enforcement

When a tenant is suspended:
- All API requests return `403 { message: "Subscription suspended" }`
- Frontend shows full-page suspension banner
- Admin Portal still accessible for CipherLearn team
- Data is NOT deleted (retained for reactivation)

### 13.3 Tenant Deletion Safety

```
Delete request → Soft delete (set deletedAt) → 30-day grace period
                                                      │
                                              Not reactivated
                                                      │
                                                      ▼
                                              Hard delete job runs:
                                              1. Delete all Cloudinary files in tenant folder
                                              2. Delete all rows with tenantId
                                              3. Delete tenant record
                                              4. Log in AdminAuditLog
```

---

## 14. Implementation Phases

### Phase 1: Database & Core Multi-Tenancy (Week 1-2)
- [ ] Add `Tenant`, `SuperAdmin`, `AdminAuditLog` models to Prisma schema
- [ ] Add `tenantId` to all existing models
- [ ] Write and run migration (with backfill for existing data)
- [ ] Create tenant resolution middleware
- [ ] Create Prisma tenant filter middleware (`$extends`)
- [ ] Update JWT to include `tenantId`
- [ ] Update all auth middleware to validate tenant

### Phase 2: Backend Service Updates (Week 2-3)
- [ ] Update all 11 dashboard service files to use tenant-scoped Prisma
- [ ] Update app auth service (login, signup, password reset)
- [ ] Update Cloudinary uploads to use tenant-scoped folders
- [ ] Update fee receipt number generation (tenant prefix)
- [ ] Update rate limiter keys to include tenantId
- [ ] Add quota enforcement checks (max students, batches, teachers, storage)
- [ ] Create Portal API routes (`/api/portal/*`)
- [ ] Create SuperAdmin auth (separate JWT)
- [ ] Create tenant CRUD service

### Phase 3: Frontend Tenant-Awareness (Week 3-4)
- [ ] Create `TenantConfigProvider` context
- [ ] Add tenant config API endpoint (public, returns branding)
- [ ] Replace hardcoded "CipherLearn" with `tenant.name` (4 locations)
- [ ] Replace hardcoded auth page colors with tenant colors
- [ ] Add feature flag gating to Sidebar nav items
- [ ] Update auth slice to include `tenantId`
- [ ] Add subdomain-based tenant resolution in frontend
- [ ] Add suspended/expired tenant screens

### Phase 4: Admin Portal (Week 4-5)
- [ ] Create portal frontend (new Next.js app or route group)
- [ ] Portal login page (SuperAdmin auth)
- [ ] Tenant list page with search/filter
- [ ] Create tenant flow (name, slug, branding, plan, first admin)
- [ ] Tenant detail page (overview, branding, subscription, users, settings)
- [ ] Suspend / Resume / Delete actions
- [ ] Cross-tenant analytics dashboard
- [ ] Audit log viewer

### Phase 5: Production & Polish (Week 5-6)
- [ ] Migrate from free tier to production hosting (Vercel Pro + Railway + Neon)
- [ ] Set up wildcard subdomain on Vercel
- [ ] Set up custom domain support flow
- [ ] Tenant-branded email templates
- [ ] Quota usage indicators in tenant dashboard
- [ ] Plan upgrade/downgrade flow
- [ ] End-to-end testing with 3+ test tenants
- [ ] Security audit (cross-tenant access testing)

---

## Appendix: Tenant Config API Response

Public endpoint (no auth required): `GET /api/tenant/config?slug=shree-academy`

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Shree Academy",
    "slug": "shree-academy",
    "logo": "https://res.cloudinary.com/.../logo.png",
    "logoInitials": "SA",
    "primaryColor": "#4f46e5",
    "accentColor": "#14b8a6",
    "contactEmail": "info@shreeacademy.in",
    "subscriptionStatus": "ACTIVE",
    "features": {
      "qrAttendance": true,
      "assignments": true,
      "fees": true,
      "studyMaterials": true,
      "announcements": true,
      "videos": true
    }
  }
}
```

This is the only data exposed publicly. No internal IDs, quotas, or admin info leaked.
