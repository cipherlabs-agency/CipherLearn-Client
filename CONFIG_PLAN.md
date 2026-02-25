# CONFIG_PLAN.md

# CipherLearn — Per-Deployment Configuration Plan

This document defines how configuration works in CipherLearn's per-deployment SaaS model.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Coaching Class A — Own Deployment                      │
│                                                         │
│  Frontend (Vercel) ── Backend (Render) ── DB (Aiven PG) │
│  .env vars set by portal at provisioning time           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Coaching Class B — Own Deployment                      │
│                                                         │
│  Frontend (Vercel) ── Backend (Render) ── DB (Aiven PG) │
│  Different env vars, completely isolated                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CipherLearn Admin Portal — Separate Product            │
│                                                         │
│  portal/ repo ── Own backend ── Own DB                  │
│  Provisions new deployments, tracks billing             │
└─────────────────────────────────────────────────────────┘
```

**Key principles:**
- Each coaching class is an **isolated deployment** (own server, own PostgreSQL DB)
- **No shared database** between coaching classes — zero cross-tenant risk
- **No `tenantId`** on any model — each DB belongs exclusively to one class
- Config lives in two tiers: **env vars** (set at deploy time) and **AppSettings table** (edited at runtime by the class admin)

---

## 2. Configuration Tiers

### Tier 1 — Deploy-Time Config (Environment Variables)

Set once when the portal provisions a new deployment. Changing these requires redeployment (handled by the portal).

#### Frontend (`NEXT_PUBLIC_*`)

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | School/institute name | `CipherLearn` |
| `NEXT_PUBLIC_APP_TAGLINE` | Short tagline below logo | `Teaching Platform` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | SEO meta description | `Comprehensive management solution…` |
| `NEXT_PUBLIC_LOGO_URL` | Logo image URL (blank = initials fallback) | `""` |
| `NEXT_PUBLIC_LOGO_INITIALS` | 2-char initials when no logo | `CL` |
| `NEXT_PUBLIC_PRIMARY_COLOR` | Brand hex color | `#0F766E` |
| `NEXT_PUBLIC_ACCENT_COLOR` | Brand accent hex color | `#F59E0B` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email on error pages | `admin@cipherlearn.com` |
| `NEXT_PUBLIC_FEATURE_QR_ATTENDANCE` | Enable QR attendance | `true` |
| `NEXT_PUBLIC_FEATURE_FEES` | Enable fee management | `true` |
| `NEXT_PUBLIC_FEATURE_ASSIGNMENTS` | Enable assignments | `true` |
| `NEXT_PUBLIC_FEATURE_STUDY_MATERIALS` | Enable resource hub | `true` |
| `NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS` | Enable announcements | `true` |
| `NEXT_PUBLIC_FEATURE_VIDEOS` | Enable YouTube video hub | `true` |

**Feature flag logic:** All features default **ON**. Set to `"false"` to disable. This way new deployments have full functionality by default and the portal only needs to set variables for disabled features.

#### Backend (plain env vars)

| Variable | Purpose |
|---|---|
| `SCHOOL_NAME` | School name (for email templates, API responses) |
| `SCHOOL_LOGO_URL` | Logo URL used in email branding |
| `PRIMARY_COLOR` | Brand color for email templates |
| `ACCENT_COLOR` | Accent color for email templates |
| `FEATURE_QR_ATTENDANCE` | Feature flag (mirrors frontend) |
| `FEATURE_FEES` | Feature flag |
| `FEATURE_ASSIGNMENTS` | Feature flag |
| `FEATURE_STUDY_MATERIALS` | Feature flag |
| `FEATURE_ANNOUNCEMENTS` | Feature flag |
| `FEATURE_VIDEOS` | Feature flag |

Accessed via `config.SCHOOL.*` and `config.FEATURES.*` from `backend/src/config/env.config.ts`.

---

### Tier 2 — Runtime Config (AppSettings DB Table)

Configurable by the class admin through the Settings UI — no redeployment needed.

#### `AppSettings` model (`backend/prisma/schema.prisma`)

```prisma
model AppSettings {
  id Int @id @default(1)   // Single-row table — always id = 1

  // School profile (admin edits via Settings > Class Profile)
  className    String @default("My Coaching Class")
  classEmail   String @default("")
  classPhone   String @default("")
  classAddress String @default("")
  classWebsite String @default("")

  // Teacher permissions matrix
  teacherPermissions Json @default("{...}")

  updatedAt DateTime @updatedAt

  @@map("app_settings")
}
```

**Why single-row?** Simplest pattern. The service always does `upsert({ where: { id: 1 }, ... })`.

---

## 3. Per-Tenant Configuration Surface

### 3.1 Identity & Branding (Deploy-Time)

| What | How | Who sets it |
|---|---|---|
| School name | `NEXT_PUBLIC_APP_NAME` + `SCHOOL_NAME` | Portal on provisioning |
| Logo image | `NEXT_PUBLIC_LOGO_URL` | Portal on provisioning |
| Logo initials | `NEXT_PUBLIC_LOGO_INITIALS` | Portal on provisioning |
| Primary color | `NEXT_PUBLIC_PRIMARY_COLOR` | Portal on provisioning |
| Accent color | `NEXT_PUBLIC_ACCENT_COLOR` | Portal on provisioning |

Consumed by `frontend/src/config/siteConfig.ts` which exports a typed `siteConfig` object used throughout the frontend.

### 3.2 Class Profile (Runtime)

| What | How | Who sets it |
|---|---|---|
| Contact email | `AppSettings.classEmail` | Class admin via Settings page |
| Phone number | `AppSettings.classPhone` | Class admin via Settings page |
| Address | `AppSettings.classAddress` | Class admin via Settings page |
| Website | `AppSettings.classWebsite` | Class admin via Settings page |

### 3.3 Feature Flags (Deploy-Time)

Feature flags are set as env vars during provisioning:

```bash
NEXT_PUBLIC_FEATURE_QR_ATTENDANCE=true
NEXT_PUBLIC_FEATURE_FEES=false    # Disable fee module for this class
NEXT_PUBLIC_FEATURE_VIDEOS=false  # Disable YouTube hub
```

The Sidebar in `frontend/src/components/layout/Sidebar.tsx` reads `siteConfig.features.*` and hides nav items for disabled features (unless user is ADMIN, who always sees everything).

### 3.4 Teacher Permissions (Runtime)

The class admin controls what teachers can do. Stored in `AppSettings.teacherPermissions` as a JSON object:

```json
{
  "canManageLectures": true,
  "canUploadNotes": true,
  "canUploadVideos": false,
  "canManageAssignments": true,
  "canViewFees": false,
  "canManageStudyMaterials": false,
  "canSendAnnouncements": true,
  "canViewAnalytics": false,
  "canExportData": false
}
```

**Defaults:** Conservative — teachers can manage content (lectures, notes, assignments, announcements) but cannot access financial data, analytics, or export.

Edited via Settings > Teacher Permissions in the dashboard (admin only).

---

## 4. Backend API

### Dashboard Settings (admin-authenticated)

```
GET    /api/dashboard/settings                    — get current settings
PUT    /api/dashboard/settings                    — update settings (partial)
POST   /api/dashboard/settings/reset-teacher-permissions  — reset to defaults
```

### App Settings (public — no auth)

```
GET    /api/app/settings
→ {
    school: { name, email, phone, address, website },
    branding: { primaryColor, accentColor, logoUrl },   ← from env vars
    features: { qrAttendance, fees, assignments, ... }, ← from env vars
    teacherPermissions: { ... }                         ← from DB
  }
```

The mobile app uses this to style the login screen and know which features to show before the user logs in.

---

## 5. Frontend

### `siteConfig.ts` (`frontend/src/config/siteConfig.ts`)

Single source of truth for all deploy-time config in the frontend. Read from `NEXT_PUBLIC_*` env vars at build/runtime.

```typescript
export const siteConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "CipherLearn",
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#0F766E",
  features: {
    qrAttendance: process.env.NEXT_PUBLIC_FEATURE_QR_ATTENDANCE !== "false",
    // ...
  },
} as const;
```

Used by:
- `app/(auth)/layout.tsx` — login page branding panel
- `components/layout/Sidebar.tsx` — feature-gated nav items + logo
- `app/layout.tsx` — page title metadata

### Settings Page (`app/(pages)/settings/page.tsx`)

Admin-only sections added:
- **Class Profile** — editable form for contact info (className, email, phone, address, website)
- **Teacher Permissions** — toggle matrix for all 9 permission flags

Non-admin users only see General (account info) and Dock Configuration.

### RTK Query Slice (`redux/slices/settings/settingsApi.ts`)

```typescript
useGetSettingsQuery()             — GET /api/dashboard/settings
useUpdateSettingsMutation()       — PUT /api/dashboard/settings
useResetTeacherPermissionsMutation() — POST /api/dashboard/settings/reset-teacher-permissions
```

Tag: `'Settings'` — invalidated on any mutation.

---

## 6. File Map

### Backend

| File | Role |
|---|---|
| `backend/prisma/schema.prisma` | `AppSettings` model (single-row) |
| `backend/src/config/env.config.ts` | `config.SCHOOL` + `config.FEATURES` (deploy-time) |
| `backend/src/modules/dashboard/settings/service.ts` | DB CRUD for AppSettings |
| `backend/src/modules/dashboard/settings/controller.ts` | Request handlers |
| `backend/src/modules/dashboard/settings/route.ts` | Express routes (GET/PUT + reset) |
| `backend/src/modules/dashboard/settings/validation.ts` | Joi schema for PUT body |
| `backend/src/modules/dashboard/routes.ts` | Registers `/settings` route |
| `backend/src/modules/app/route.ts` | Public `GET /api/app/settings` |

### Frontend

| File | Role |
|---|---|
| `frontend/src/config/siteConfig.ts` | Deploy-time config from `NEXT_PUBLIC_*` |
| `frontend/src/redux/slices/settings/settingsApi.ts` | RTK Query slice for settings |
| `frontend/src/redux/api/api.ts` | `'Settings'` added to `tagTypes` |
| `frontend/src/app/(pages)/settings/page.tsx` | Settings page (Class Profile + Teacher Permissions sections) |

---

## 7. How the Portal Provisions a New Deployment

When the CipherLearn Admin Portal creates a new coaching class:

1. **Allocates resources** — provisions a new PostgreSQL DB, sets up backend + frontend environments
2. **Sets env vars** — fills in `NEXT_PUBLIC_APP_NAME`, `SCHOOL_NAME`, `PRIMARY_COLOR`, feature flags, etc. based on what the class owner chose
3. **Deploys** — triggers Vercel/Render deployments with those env vars
4. **Seeds DB** — creates the first Admin user account in the new DB
5. **Sends welcome email** — admin gets their credentials

After provisioning, the class admin logs in and can further configure:
- School contact info (runtime, via Settings > Class Profile)
- Teacher permissions (runtime, via Settings > Teacher Permissions)

---

## 8. Security

- **Isolation by deployment** — each class has its own DB; no row-level segregation needed
- **Auth middleware** — all settings endpoints require `isAuthenticated` (GET) or `isAdmin` (PUT/POST)
- **No secrets in AppSettings** — the table only stores non-sensitive config (contact info, permissions)
- **Feature flags via env vars** — cannot be changed by the class admin (portal controls what features a class has)
- **Teacher permissions are advisory** — the DB stores them; future middleware can enforce them per endpoint

---

*Last updated: 2026-02-25*
*Architecture: Per-deployment isolation (no shared DB, no tenantId)*
