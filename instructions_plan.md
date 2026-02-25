# CipherLearn Admin Portal — Implementation Brief

> **This document is the authoritative brief for building the CipherLearn Admin Portal.**
> The Admin Portal is a **completely separate product** in its own repository (`portal/`).
> It has its OWN backend (Express), its OWN frontend (Next.js), and its OWN PostgreSQL database.
> It does NOT share a database or codebase with coaching class deployments.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  Coaching Class A — client/ repo (deployed instance #1)      │
│                                                              │
│  frontend/ ── backend/ ── PostgreSQL DB A                    │
│  (Next.js)    (Express)   (isolated, no shared data)         │
│                                                              │
│  API surface:                                                │
│    /api/auth/*           ← admin/teacher login               │
│    /api/dashboard/*      ← admin/teacher dashboard           │
│    /api/app/*            ← student/teacher mobile app        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Coaching Class B — client/ repo (deployed instance #2)      │
│                                                              │
│  frontend/ ── backend/ ── PostgreSQL DB B                    │
│  (same codebase, different env vars, different DB)           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  CipherLearn Admin Portal — portal/ repo  ← YOU BUILD THIS  │
│                                                              │
│  portal-frontend/ (Next.js)  — deployed at portal.cipherlearn.com
│  portal-backend/ (Express)   — deployed at api.portal.cipherlearn.com
│  Portal PostgreSQL DB        — tracks all coaching class deployments
│                                                              │
│  The portal DOES NOT connect to any coaching class DB.       │
│  It manages deployments at the infrastructure level.         │
└──────────────────────────────────────────────────────────────┘
```

**Why separate repos and DBs?**
- Coaching class data (students, fees, attendance) never lives in the portal DB
- The portal tracks deployment metadata only: which classes exist, their plan, status, branding
- A portal outage never affects running coaching class deployments
- Security: portal admins cannot query coaching class data directly

---

## 2. What the Portal Manages

The portal is CipherLearn's internal **Control Plane**. It lets the CipherLearn team:

| Action | Description |
|--------|-------------|
| **Provision** | Create a new coaching class deployment (configure env vars, seed first admin user) |
| **Configure** | Update branding (name, logo, colors), feature flags for a deployment |
| **Monitor** | View student/batch/teacher counts (queried from each deployment's API) |
| **Suspend** | Block login access to a deployment whose subscription has lapsed |
| **Resume** | Re-enable a suspended deployment |
| **Cancel / Delete** | Soft-delete (30-day grace) or hard-delete a deployment's records |
| **Billing** | Track subscription plan, trial/expiry dates, record payments manually |
| **Payment tracking** | Record payments received from coaching class owners, view payment history |
| **SuperAdmin management** | Invite, assign roles (OWNER/ADMIN/SUPPORT), revoke access |

---

## 3. Portal Database Schema

The portal has its own DB with these key models:

```prisma
// portal/prisma/schema.prisma

model Deployment {
  id                  Int                @id @default(autoincrement())
  name                String             // "Shree Academy"
  slug                String             @unique // "shree-academy"
  contactEmail        String
  contactPhone        String?
  ownerName           String?
  address             String?
  website             String?

  // Branding (set as env vars on the actual deployment)
  logo                String?
  logoInitials        String             @default("CL")
  primaryColor        String             @default("#0F766E")
  accentColor         String             @default("#F59E0B")

  // Infrastructure
  frontendUrl         String?            // e.g. https://shree-academy.vercel.app
  backendUrl          String?            // e.g. https://shree-academy-api.onrender.com

  // Subscription
  plan                DeploymentPlan     @default(FREE)
  subscriptionStatus  SubscriptionStatus @default(TRIAL)
  trialEndsAt         DateTime?
  subscriptionEndsAt  DateTime?

  // Feature flags (portal sets these as env vars on the deployment)
  featureQRAttendance   Boolean @default(true)
  featureAssignments    Boolean @default(false)
  featureFees           Boolean @default(false)
  featureStudyMaterials Boolean @default(false)
  featureAnnouncements  Boolean @default(true)
  featureVideos         Boolean @default(false)

  // Quota limits (plan-based defaults, overridable)
  maxStudents   Int @default(50)
  maxBatches    Int @default(3)
  maxTeachers   Int @default(2)

  // Lifecycle
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  suspendedAt     DateTime?
  cancelledAt     DateTime?
  deletedAt       DateTime?
  suspendedReason String?

  auditLogs AuditLog[]
  payments  Payment[]
  @@map("deployments")
}

model SuperAdmin {
  id        Int            @id @default(autoincrement())
  name      String
  email     String         @unique
  password  String         // bcrypt hashed
  role      SuperAdminRole @default(SUPPORT)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  auditLogs AuditLog[]
  payments  Payment[]      // payments recorded by this admin
  @@map("super_admins")
}

model AuditLog {
  id             Int         @id @default(autoincrement())
  superAdminId   Int
  superAdmin     SuperAdmin  @relation(fields: [superAdminId], references: [id])
  deploymentId   Int?
  deployment     Deployment? @relation(fields: [deploymentId], references: [id])
  action         String      // "DEPLOYMENT_CREATED", "PLAN_CHANGED", "SUSPENDED", "PAYMENT_RECORDED" etc.
  metadata       Json?       // before/after values, notes
  ipAddress      String?
  createdAt      DateTime    @default(now())
  @@index([superAdminId])
  @@index([deploymentId])
  @@map("audit_logs")
}

// ─── Payment Tracking ───────────────────────────────────────

model Payment {
  id             Int            @id @default(autoincrement())
  deploymentId   Int
  deployment     Deployment     @relation(fields: [deploymentId], references: [id])
  recordedById   Int
  recordedBy     SuperAdmin     @relation(fields: [recordedById], references: [id])

  amount         Float          // Amount in INR (or currency below)
  currency       String         @default("INR")
  plan           DeploymentPlan // Plan this payment is for
  paymentMethod  PaymentMethod  @default(UPI)
  referenceId    String?        // UTR number, cheque number, transaction ID etc.
  notes          String?        // Any extra notes
  paymentDate    DateTime       // When the payment was received
  periodStart    DateTime?      // Subscription period covered — start
  periodEnd      DateTime?      // Subscription period covered — end

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([deploymentId])
  @@index([recordedById])
  @@index([paymentDate])
  @@map("payments")
}

enum DeploymentPlan    { FREE STARTER PRO ENTERPRISE }
enum SubscriptionStatus { ACTIVE TRIAL SUSPENDED CANCELLED EXPIRED }
enum SuperAdminRole    { OWNER ADMIN SUPPORT }
enum PaymentMethod     { UPI BANK_TRANSFER CHEQUE CASH CARD OTHER }
```

**What the portal does NOT store:**
- Students, batches, attendance, class-level fees, notes, assignments — those live in each class's own DB
- Teacher permissions — configured by the class admin in their own Settings page

---

## 4. Portal Backend API

**Base URL:** `https://api.portal.cipherlearn.com/api`

All endpoints (except login) require `Authorization: Bearer <portalToken>` — JWT signed with the portal's own `PORTAL_JWT_SECRET`.

### 4.1 SuperAdmin Auth

```
POST   /auth/login           Body: { email, password } → { token, superAdmin }
POST   /auth/logout
GET    /auth/me
```

### 4.2 Deployments

```
GET    /deployments              Query: page, limit, search, plan, status
POST   /deployments              Create deployment record
GET    /deployments/:id          Full detail + latest usage stats
PATCH  /deployments/:id          Update contact/branding
PATCH  /deployments/:id/plan     Change plan + recalc quota defaults
PATCH  /deployments/:id/features Update feature flags
POST   /deployments/:id/suspend  Body: { reason }
POST   /deployments/:id/resume
POST   /deployments/:id/cancel
DELETE /deployments/:id          Soft delete (sets deletedAt)
DELETE /deployments/:id/purge    Hard delete all records (OWNER only)
GET    /deployments/:id/usage    Fetch live counts from deployment's own API
```

**Usage stats (`GET /deployments/:id/usage`):**
The portal calls each coaching class backend:
```
GET https://{deployment.backendUrl}/api/dashboard/analytics/summary
Authorization: Bearer <deployment-service-token>
```
Returns: `{ studentCount, batchCount, teacherCount }`.

### 4.3 Payment Tracking

```
GET    /payments                     Query: page, limit, deploymentId, plan, method, from, to
POST   /payments                     Record a new payment (ADMIN/OWNER only)
GET    /payments/:id                 Payment detail
PATCH  /payments/:id                 Edit a payment (OWNER only — corrections)
DELETE /payments/:id                 Delete a payment (OWNER only)

GET    /deployments/:id/payments     All payments for a specific deployment
```

**POST /payments body:**
```json
{
  "deploymentId": 3,
  "amount": 2999,
  "currency": "INR",
  "plan": "STARTER",
  "paymentMethod": "UPI",
  "referenceId": "UTR123456789",
  "notes": "Paid via PhonePe",
  "paymentDate": "2026-02-25",
  "periodStart": "2026-03-01",
  "periodEnd": "2026-03-31"
}
```

On payment creation:
- Automatically extend `deployment.subscriptionEndsAt` to `periodEnd` if it's later
- Log to AuditLog with `action: "PAYMENT_RECORDED"`

### 4.4 Analytics

```
GET    /analytics/overview   { totalDeployments, active, trial, suspended, newThisMonth, mrrThisMonth }
GET    /analytics/growth     Query: months=12 → monthly deployment growth
GET    /analytics/plans      [{ plan, count }] for DonutChart
GET    /analytics/expiring   Query: days=14 → deployments expiring soon
GET    /analytics/revenue    Query: months=12 → monthly revenue totals (sum of payments)
```

**MRR calculation** (`mrrThisMonth`): sum of all `Payment.amount` where `paymentDate` is in the current month.

### 4.5 Audit Log

```
GET    /audit                Query: page, limit, superAdminId, action, deploymentId, from, to
```

### 4.6 SuperAdmin Management (OWNER only)

```
GET    /admins
POST   /admins               Body: { name, email, password, role }
PATCH  /admins/:id/role
DELETE /admins/:id
```

---

## 5. Portal Frontend

**Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, RTK Query, Radix UI primitives.
**Deployed at:** `portal.cipherlearn.com`

### 5.1 Project Structure

```
portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css              ← Copy design tokens from client/frontend
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   └── (portal)/
│   │       ├── layout.tsx           ← Sidebar + TopBar
│   │       ├── dashboard/page.tsx
│   │       ├── deployments/
│   │       │   ├── page.tsx         ← List view
│   │       │   ├── new/page.tsx     ← Create wizard
│   │       │   └── [id]/
│   │       │       ├── page.tsx     ← Overview tab
│   │       │       ├── branding/page.tsx
│   │       │       ├── subscription/page.tsx
│   │       │       ├── features/page.tsx
│   │       │       ├── payments/page.tsx   ← Payment history + record payment
│   │       │       └── danger/page.tsx
│   │       ├── payments/page.tsx    ← All payments across all deployments
│   │       ├── audit-log/page.tsx
│   │       └── settings/
│   │           ├── page.tsx
│   │           └── admins/page.tsx
│   ├── redux/
│   │   ├── store.ts
│   │   ├── api/portalApi.ts
│   │   └── slices/
│   │       ├── auth/authSlice.ts
│   │       ├── deployments/deploymentsApi.ts
│   │       ├── payments/paymentsApi.ts     ← NEW
│   │       ├── analytics/analyticsApi.ts
│   │       └── audit/auditApi.ts
│   └── middleware.ts
└── package.json
```

### 5.2 Auth Flow

```typescript
// POST /auth/login response
{
  success: true,
  data: {
    token: string,
    superAdmin: { id: number, name: string, email: string, role: "OWNER" | "ADMIN" | "SUPPORT" }
  }
}
```

Store as `localStorage.getItem("portalToken")` — separate from coaching class `token`.

### 5.3 RTK Query Base

```typescript
// src/redux/api/portalApi.ts
export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_PORTAL_API_URL + '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("portalToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["DEPLOYMENTS", "DEPLOYMENT_DETAIL", "PAYMENTS", "ANALYTICS", "AUDIT_LOG", "SUPER_ADMINS"],
  endpoints: () => ({}),
});
```

### 5.4 Role-Based Access

| Action | OWNER | ADMIN | SUPPORT |
|--------|-------|-------|---------|
| View deployments | ✓ | ✓ | ✓ |
| Create deployment | ✓ | ✓ | ✗ |
| Edit branding/features | ✓ | ✓ | ✗ |
| Suspend / Resume | ✓ | ✓ | ✗ |
| Delete (soft) | ✓ | ✓ | ✗ |
| Purge (hard delete) | ✓ | ✗ | ✗ |
| Record payment | ✓ | ✓ | ✗ |
| Edit / Delete payment | ✓ | ✗ | ✗ |
| View payments | ✓ | ✓ | ✓ |
| View audit log | ✓ | ✓ | ✓ |
| Manage SuperAdmins | ✓ | ✗ | ✗ |

---

## 6. Page Specifications

### Dashboard

**KPI Cards:**
- Total Deployments (active / trial / suspended breakdown)
- New This Month
- Trial Ending (next 14 days)
- MRR — sum of payments received this month (e.g., ₹14,997)

**Charts:**
- Deployment Growth (AreaChart — monthly, 12 months)
- Plan Distribution (DonutChart — FREE/STARTER/PRO/ENTERPRISE)
- Revenue (BarChart — monthly totals from `GET /analytics/revenue`)

**Expiring Soon widget:** deployments from `GET /analytics/expiring?days=14`

### Deployments List

Table: name + slug, plan badge, status badge, created date, expires date, "View" action.
Filters: search, plan tabs, status tabs.

### Create Deployment (`/deployments/new`)

**3-step wizard:**

**Step 1 — Identity:** class name → auto-generates slug, contact email, phone, owner name.

**Step 2 — Plan & Features:** plan cards, feature flag toggles, trial/subscription end dates.

**Step 3 — Branding:** primary color, accent color, logo URL, logo initials.

### Deployment Detail

**Tab: Overview** — Usage bars (Students, Batches, Teachers), subscription info, quick actions.

**Tab: Branding** — Name, contact info, colors, logo.

**Tab: Subscription** — Plan selector, subscription/trial dates.

**Tab: Features** — Feature flag toggle grid.

**Tab: Payments** — Payment history for this deployment + "Record Payment" button.

**Tab: Danger Zone** — Suspend / Resume / Cancel / Delete / Purge (with confirmations).

### Payments Page (`/payments`)

All payments across all deployments.

**Table columns:** Date, Deployment name, Plan, Amount, Method, Reference ID, Recorded by, Actions.

**Filters:** deployment search, plan, payment method, date range.

**"Record Payment" button** (ADMIN/OWNER) → opens a modal/drawer:

```
Form fields:
  Deployment *        (searchable dropdown)
  Amount (INR) *      (number input)
  Plan *              (dropdown: STARTER / PRO / ENTERPRISE)
  Payment Method *    (UPI / Bank Transfer / Cheque / Cash / Card / Other)
  Reference ID        (UTR, cheque no., transaction ID)
  Payment Date *      (date picker — defaults to today)
  Period Start        (date picker — subscription period start)
  Period End          (date picker — subscription period end)
  Notes               (textarea)
```

On submit → `POST /payments` → toast "Payment recorded" → invalidate `PAYMENTS` + `DEPLOYMENT_DETAIL` tags.

**Edit payment** (OWNER only): pencil icon → inline edit modal, same fields, `PATCH /payments/:id`.

**Delete payment** (OWNER only): trash icon → confirm dialog → `DELETE /payments/:id`.

### Deployment Detail — Payments Tab

Same payment list but pre-filtered for this deployment.
Shows total paid + outstanding (if `subscriptionEndsAt` is in the past).
"Record Payment" button pre-fills the deployment field.

---

## 7. Design System

Copy `globals.css` from `client/frontend` — same warm teal + amber palette, same typography rules.

**Portal-specific status badges:**
```css
.status-active    { background: #DCFCE7; color: #16A34A; }
.status-trial     { background: #DBEAFE; color: #2563EB; }
.status-suspended { background: #FEF3C7; color: #D97706; }
.status-expired   { background: #FEE2E2; color: #DC2626; }
.status-cancelled { background: #F3F4F6; color: #6B7280; }
```

**Payment method badges:**
```css
.method-upi      { background: #EDE9FE; color: #7C3AED; }
.method-bank     { background: #DBEAFE; color: #2563EB; }
.method-cash     { background: #DCFCE7; color: #16A34A; }
.method-cheque   { background: #FEF3C7; color: #D97706; }
```

---

## 8. Environment Variables

### Portal Backend
```bash
PORT=4000
DATABASE_URL=postgresql://...
PORTAL_JWT_SECRET=...
PORTAL_JWT_EXPIRES_IN=8h
CLIENT_URL=https://portal.cipherlearn.com
DEPLOYMENT_SERVICE_TOKEN=...     # Used to call coaching class APIs for usage stats
```

### Portal Frontend
```bash
NEXT_PUBLIC_PORTAL_API_URL=https://api.portal.cipherlearn.com
NEXT_PUBLIC_PORTAL_VERSION=1.0.0
```

---

## 9. Implementation Order

### Phase 1 — Foundation
1. Init Next.js (portal frontend) + Express (portal backend)
2. Copy design tokens from `client/frontend/globals.css`
3. Portal DB schema (Deployment, SuperAdmin, AuditLog, Payment models)
4. SuperAdmin auth (login, JWT, `isSuperAdmin` middleware)
5. Portal frontend login page + RTK Query auth slice
6. Portal layout (Sidebar + TopBar) + Next.js route protection middleware

### Phase 2 — Deployment CRUD
7. `deploymentsApi.ts` RTK Query slice
8. Deployments list page (table + filters)
9. Create deployment wizard (3 steps)
10. Deployment detail shell (tabs)
11. Overview tab (usage + subscription info)
12. Branding + Features tabs

### Phase 3 — Payment Tracking
13. `paymentsApi.ts` RTK Query slice
14. Global payments page (`/payments`) — table, filters, record payment modal
15. Deployment detail Payments tab (pre-filtered list + totals)
16. Record Payment form (all fields, auto-extend subscriptionEndsAt)
17. Edit / Delete payment (OWNER only)
18. Dashboard MRR card + Revenue BarChart

### Phase 4 — Subscription Management
19. Subscription tab (plan change)
20. Danger Zone tab (suspend/resume/cancel/delete/purge with confirmations)

### Phase 5 — Analytics & Audit
21. Dashboard (KPI cards + charts) using analytics endpoints
22. Expiring deployments widget
23. Audit log page
24. SuperAdmin management page

### Phase 6 — Polish
25. Slug availability checker (real-time)
26. All empty states and loading skeletons
27. Mobile responsiveness

---

## 10. Key Implementation Rules

1. **Token key**: `localStorage.getItem("portalToken")` — NOT `"token"` (that's the class user token)
2. **No class DB access**: Portal never queries student/batch/fee tables directly
3. **Usage stats**: Always fetched from each class's own API (not stored in portal DB)
4. **Payment recording**: Manual only — no payment gateway integration
5. **Auto-extend subscription**: When recording a payment with `periodEnd`, update `deployment.subscriptionEndsAt` if `periodEnd` is later
6. **Currency**: Default INR. Store as `Float` (paise precision not needed for display)
7. **All destructive actions**: Use proper AlertDialog — never `window.confirm()`
8. **Audit log**: Every mutation logs to AuditLog automatically on the backend
9. **Separate JWT secret**: Portal JWT signed with `PORTAL_JWT_SECRET`, NOT the class `JWT_SECRET`
10. **Terminology**: Use "class" / "coaching class" not "school" or "tenant" in all UI copy

---

## 11. What NOT to Do

- Do NOT add portal API routes to the `client/` backend — they are separate products
- Do NOT share a database between the portal and any coaching class deployment
- Do NOT use the class `JWT_SECRET` for portal auth
- Do NOT query class student/fee data from the portal — only usage counts via API
- Do NOT implement payment gateway (Razorpay, Stripe etc.) — payments are recorded manually
- Do NOT call them "tenants" or "schools" in the UI — they are "classes" or "coaching classes"
- Do NOT hardcode deployment IDs or slugs anywhere in the portal code

---

*Last updated: 2026-02-25*
*Architecture: Per-deployment isolation — portal is a completely separate product*
