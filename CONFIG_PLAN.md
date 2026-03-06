# CipherLearn — SaaS Operations & Testing Master Guide

> **Source of truth.** Deep-read from actual source files. Updated 2026-03-06 (v3).
> Covers: hardcoded items, env injection, complete from-scratch setup, testing data.
>
> **v2 changes (2026-03-03):** DB tables renamed `tenants` → `classes`. New `ClassEnvVar` model.
> Portal Infrastructure tab: full CRUD for per-class env vars. `pushEnvVarsToClass` merges
> auto-computed vars + portal-stored vars before pushing to Vercel/Render.
>
> **v3 changes (2026-03-06):** Auto-Provision button removed from portal — infrastructure is now
> linked manually (create resources on platform dashboards, then link via portal Link Resource).
> Per-class platform credentials added: each class stores its own Vercel/Render/Aiven API keys
> encrypted in the portal DB, overriding global `.env` fallback tokens for all hosting ops.
> Render free tier cold-start warning added to pre-sale blockers (Section 11A).
> Section 3D (per-class credentials reference) added. Phase 2 setup flow updated.

---

## Table of Contents

1. [All Hardcoded Items to Change Before Selling](#1-all-hardcoded-items-to-change-before-selling)
2. [How Env Vars Are Found and Injected](#2-how-env-vars-are-found-and-injected)
3. [Complete Environment Variable Reference](#3-complete-environment-variable-reference)
4. [Testing Data (Ready to Copy-Paste)](#4-testing-data-ready-to-copy-paste)
5. [From-Scratch Setup: Phase 1 — Admin Portal + Class Creation](#5-from-scratch-setup-phase-1--admin-portal--class-creation)
6. [From-Scratch Setup: Phase 2 — Hosting (Vercel + Render + Aiven)](#6-from-scratch-setup-phase-2--hosting-vercel--render--aiven)
7. [From-Scratch Setup: Phase 3 — Class Admin Dashboard + Feature Testing](#7-from-scratch-setup-phase-3--class-admin-dashboard--feature-testing)
8. [The App (Student/Teacher Web App) — Config Guide](#8-the-app-studentteacher-web-app--config-guide)
9. [What Push Env Vars Does vs What Stays Manual](#9-what-push-env-vars-does-vs-what-stays-manual)
10. [Infrastructure Ownership — Critical Mental Model](#10-infrastructure-ownership--critical-mental-model)
11. [Known Issues, Pain Points & Fixes](#11-known-issues-pain-points--fixes)
12. [Previously Fixed Issues](#12-was-previously-known-issues)

---

## 1. All Hardcoded Items to Change Before Selling

These are things baked into the client codebase that say "CipherLearn" or use
specific colors/values regardless of what env vars you set.

### 1A. Email Templates — `client/backend/src/utils/email.ts`

Every email function has hardcoded "CipherLearn" branding. When you sell to
"Sharma Academy", their students receive emails that say CipherLearn.

| Function | What's Hardcoded | Line(s) |
|---|---|---|
| `sendPasswordResetEmail` | `<h1>CipherLearn</h1>`, purple `#6366f1` gradient, "from CipherLearn" footer | ~62–95 |
| `sendAccountRegistrationEmail` | `<h1>CipherLearn</h1>`, "account has been created on CipherLearn", "Open the CipherLearn app" | ~124–170 |
| `sendAdminPasswordResetEmail` | `<h1>CipherLearn</h1>`, teal gradient | ~195–230 |
| `sendWelcomeEmail` | `<h1>CipherLearn</h1>`, purple gradient, "Log in to the CipherLearn Student App" | ~253–295 |
| All email subjects | `"Password Reset OTP - CipherLearn"`, `"Welcome to CipherLearn..."`, `"Your CipherLearn Account is Ready"` | various |

**Fix (before going beyond beta):**
Replace every hardcoded `CipherLearn` string with `${config.CLASS.NAME}`.
Replace every hardcoded `#6366f1` with `${config.CLASS.PRIMARY_COLOR}`.
Replace every hardcoded `#8b5cf6` with `${config.CLASS.ACCENT_COLOR}`.

**Fix example for subject line:**
```typescript
// Before
subject: "Password Reset OTP - CipherLearn"

// After
subject: `Password Reset OTP - ${config.CLASS.NAME}`
```

**Fix example for email body gradient:**
```typescript
// Before
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)

// After
background: linear-gradient(135deg, ${config.CLASS.PRIMARY_COLOR} 0%, ${config.CLASS.ACCENT_COLOR} 100%)
```

---

### 1B. Login Page Feature List — `client/frontend/src/app/(auth)/layout.tsx`

The left panel of the login page has a hardcoded feature highlight list:
```tsx
{ icon: "📋", text: "One-click attendance tracking" },
{ icon: "💰", text: "Automated fee reminders" },
{ icon: "📊", text: "Real-time student progress" },
```
And a hardcoded testimonial:
```tsx
"Happy Teacher"  // ← hardcoded attribution
```
These are fine for now (generic enough). Replace with a real testimonial per client when ready.

---

### 1C. Prisma Query Logging to console.log — `client/backend/src/config/db.config.ts`

```typescript
// Line 28-30: every DB query is logged to stdout
console.log(`Query: ${e.query}`);
console.log(`Params: ${params.join(", ")}`);
console.log(`Duration: ${e.duration.toFixed(3)}ms`);
```
This floods Render logs in production. **Disable before shipping:**
Set `NODE_ENV=production` — add a guard:
```typescript
private defaultQueryLogger = (e: Prisma.QueryEvent): void => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Query: ${e.query}`);
    console.log(`Params: ${e.params}`);
    console.log(`Duration: ${e.duration.toFixed(3)}ms`);
  }
};
```

---

### 1D. Orphan DB Connection — `client/backend/src/config/db.config.ts:55`

```typescript
export const prisma = new Database().prisma;  // ← line 55
```
This creates a SECOND Database instance (and second PrismaClient + pg connection pool)
just to export `prisma`. The first one is created in `startServer()` via `const db = new Database()`.
Non-blocking but wastes a connection slot on Aiven free tier.

**Fix:**
```typescript
// Export the singleton — don't create a second instance
let _prisma: PrismaClient | null = null;
export const prisma = (() => {
  if (!_prisma) _prisma = new Database().prisma;
  return _prisma;
})();
```
Or simpler: share the single instance from `index.ts`.

---

### 1E. `CLOUDINAIRY` Typo — `client/backend/src/config/env.config.ts:22`

```typescript
CLOUDINAIRY: {   // ← misspelled (CLOUDINARY)
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
```
The **env var names are correct** (`CLOUDINARY_CLOUD_NAME` etc.) so runtime works fine.
The TypeScript key is just cosmetically wrong. Non-blocking.

---

### 1F. JWT_SECRET Default — `client/backend/src/config/env.config.ts:28`

```typescript
SECRET: process.env.JWT_SECRET || "your_jwt_secret",
```
If JWT_SECRET is not set, anyone who knows the default can forge tokens for any class.
**CRITICAL: Always set a strong JWT_SECRET on Render. Never leave the default.**

---

### 1G. Admin Password Reset Flow

The admin forgot-password flow sends an email with the raw JWT reset token.
The admin must manually call `POST /api/auth/reset-password` with that token.
There is no reset link in the email — just the raw token.
Fine for beta (admin = you), but needs a reset URL in the email before selling widely.

---

### 1H. Teacher Permissions — Advisory Only

Teacher permissions (canViewFees, canUploadVideos, etc.) are stored in AppSettings
and respected by the frontend sidebar. But **individual API routes do not check them**.
A teacher with canViewFees=false can still call `GET /api/dashboard/fees` directly.
Frontend enforcement only. Fine for trusted teachers; fix before untrusted multi-tenant.

---

## 2. How Env Vars Are Found and Injected

```
╔═══════════════════════════════════════════════════════════════════════╗
║  LAYER 1 — Vercel Build-Time  (baked into JS bundle, never changes)   ║
║                                                                       ║
║  Triggered by: npm run build on Vercel (or manual redeploy)           ║
║  Source:       client/frontend/src/config/siteConfig.ts               ║
║  Mechanism:    process.env.NEXT_PUBLIC_* read at build → JS constant  ║
║                                                                       ║
║  Controls:                                                            ║
║    Page <title>, meta description         ← NEXT_PUBLIC_APP_NAME      ║
║    Login page gradient + logo + name      ← NEXT_PUBLIC_PRIMARY_COLOR ║
║    Sidebar feature flag visibility        ← NEXT_PUBLIC_FEATURE_*     ║
║    Every API call's base URL              ← NEXT_PUBLIC_API_URL        ║
║                                                                       ║
║  To change → update Vercel env var → click Redeploy                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 2 — Render Process-Time  (loaded at Node.js startup)           ║
║                                                                       ║
║  Triggered by: npm start on Render (every deploy or restart)          ║
║  Source:       client/backend/src/config/env.config.ts                ║
║  Mechanism:    dotenv.config() → process.env.* → config object        ║
║                                                                       ║
║  Controls:                                                            ║
║    DB connection                          ← DB_URL                    ║
║    JWT signing + verification             ← JWT_SECRET                ║
║    Password hashing rounds                ← SALT                      ║
║    CORS allowed origins                   ← CLIENT_URL                ║
║    Who can sign up as admin               ← ADMIN_EMAILS              ║
║    File uploads destination               ← CLOUDINARY_*              ║
║    Email delivery                         ← NODE_MAILER_*             ║
║    Branding in emails + /api/app/settings ← CLASS_NAME, PRIMARY_COLOR ║
║    Feature flags served to app            ← FEATURE_*                 ║
║                                                                       ║
║  To change → update Render env var → Render auto-redeploys            ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 3 — Database Runtime  (no redeploy, instant)                   ║
║                                                                       ║
║  Triggered by: admin saves settings in dashboard                      ║
║  Source:       AppSettings table (id=1, single row)                   ║
║  Mechanism:    settingsService.getSettings() → Prisma query           ║
║                                                                       ║
║  Controls:                                                            ║
║    Class profile (name, email, phone)     ← AppSettings.className     ║
║    Teacher permissions (9 flags)          ← AppSettings.teacherPermissions ║
║                                                                       ║
║  To change → Admin logs in → /settings → save → immediate             ║
╠═══════════════════════════════════════════════════════════════════════╣
║  LAYER 4 — Portal Stored Env Vars  (ClassEnvVar DB table)             ║
║                                                                       ║
║  Triggered by: OWNER/ADMIN adds vars in Infrastructure tab            ║
║  Source:       class_env_vars table (admin DB, encrypted if secret)   ║
║  Mechanism:    pushEnvVarsToClass() reads & decrypts → merges         ║
║                                                                       ║
║  Each var has:                                                        ║
║    key       — e.g. RAZORPAY_KEY_ID                                   ║
║    value     — encrypted at rest if isSecret=true                     ║
║    target    — VERCEL | RENDER | BOTH                                 ║
║    isSecret  — hides value in UI after save (shown as ••••••••)       ║
║                                                                       ║
║  Controls:  Any extra env vars the class needs beyond the auto-set    ║
║    e.g. payment gateway keys, analytics IDs, feature tokens           ║
║                                                                       ║
║  To change → Portal → Classes → [class] → Infrastructure → Env Vars  ║
║              → Edit or Add → click "Push to All" to deploy            ║
╠═══════════════════════════════════════════════════════════════════════╣
║  PUBLIC ENDPOINT — GET /api/app/settings  (no auth required)          ║
║                                                                       ║
║  Returns a MIX of Layer 2 + Layer 3:                                  ║
║    branding.primaryColor   ← Layer 2 (env var CLASS_PRIMARY_COLOR)    ║
║    branding.logoUrl        ← Layer 2 (env var CLASS_LOGO_URL)         ║
║    features.fees           ← Layer 2 (env var FEATURE_FEES)           ║
║    class.name              ← Layer 3 (AppSettings DB)                 ║
║    teacherPermissions      ← Layer 3 (AppSettings DB)                 ║
║                                                                       ║
║  Used by: student app BEFORE login to style the login screen          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 3. Complete Environment Variable Reference

### 3A. Client Backend — Render (all vars, from actual source)

```bash
# ── SERVER ─────────────────────────────────────────────────────────────────
APP_PORT=5000                         # Must be 5000 for Render free tier
APP_HOST=0.0.0.0                      # Unused in startServer() but set it anyway
NODE_ENV=production

# ── DATABASE ───────────────────────────────────────────────────────────────
DB_URL=postgresql://user:pass@host:port/dbname?sslmode=require
# Individual DB_HOST/PORT/USER/PASSWORD/NAME are IGNORED when DB_URL is set

# ── SECURITY ───────────────────────────────────────────────────────────────
JWT_SECRET=<openssl rand -hex 32>     # CRITICAL: must be strong, never default
JWT_EXPIRES_IN=1h
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
QR_SECRET=<openssl rand -hex 16>      # For QR attendance tokens
SALT=10                               # bcrypt rounds — CRITICAL: must be set

# ── CORS ───────────────────────────────────────────────────────────────────
CLIENT_URL=https://cipherlearn-sharma.vercel.app   # Exact Vercel URL of this class

# ── ADMIN ACCESS ───────────────────────────────────────────────────────────
ADMIN_EMAILS=owner@sharma.com         # Comma-separated; EMPTY = nobody can sign up!

# ── CLOUDINARY (file uploads) ───────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=my-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123xyz789

# ── EMAIL (NodeMailer) ─────────────────────────────────────────────────────
NODE_MAILER_HOST=smtp.gmail.com
NODE_MAILER_PORT=587
NODE_MAILER_USER=noreply@sharma.com
NODE_MAILER_PASSWORD=<gmail-app-password>    # NOT NODE_MAILER_PASS
NODE_MAILER_FROM_EMAIL=noreply@sharma.com    # NOT NODE_MAILER_FROM
NODE_MAILER_FROM_NAME=Sharma Coaching Academy

# ── BRANDING (reflected in emails + GET /api/app/settings) ─────────────────
CLASS_NAME=Sharma Coaching Academy
CLASS_LOGO_URL=https://cdn.example.com/sharma-logo.png
PRIMARY_COLOR=#0F766E
ACCENT_COLOR=#F59E0B

# ── FEATURE FLAGS (all ON by default; set "false" to disable) ───────────────
FEATURE_QR_ATTENDANCE=true
FEATURE_FEES=true
FEATURE_ASSIGNMENTS=true
FEATURE_STUDY_MATERIALS=true
FEATURE_ANNOUNCEMENTS=true
FEATURE_VIDEOS=true

# ── RATE LIMITS (optional — defaults shown) ─────────────────────────────────
ACCOUNT_LOCKOUT_MAX_FAILED=5
ACCOUNT_LOCKOUT_DURATION_MINUTES=30
OTP_EXPIRY_MINUTES=10
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000

# ── INSTAGRAM (optional) ───────────────────────────────────────────────────
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=sharma_ig_webhook_2026
INSTAGRAM_REDIRECT_URI=
```

### 3B. Client Frontend — Vercel (NEXT_PUBLIC_* only)

```bash
# ── API CONNECTION ─────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://cipherlearn-sharma-api.onrender.com/api
# AUTO-PUSHED by Portal "Push Env Vars" button. Must end in /api.

# ── BRANDING (baked at build time) ─────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=Sharma Coaching Academy
NEXT_PUBLIC_APP_TAGLINE=Empowering Students Since 2020
NEXT_PUBLIC_APP_DESCRIPTION=Complete management platform for Sharma Academy.
NEXT_PUBLIC_LOGO_URL=https://cdn.example.com/sharma-logo.png
NEXT_PUBLIC_LOGO_INITIALS=SA            # 2 chars — shown when no logo URL
NEXT_PUBLIC_PRIMARY_COLOR=#0F766E
NEXT_PUBLIC_ACCENT_COLOR=#F59E0B
NEXT_PUBLIC_CONTACT_EMAIL=info@sharma.com

# ── FEATURE FLAGS (baked at build; mirror Render FEATURE_* vars exactly) ───
NEXT_PUBLIC_FEATURE_QR_ATTENDANCE=true
NEXT_PUBLIC_FEATURE_FEES=true
NEXT_PUBLIC_FEATURE_ASSIGNMENTS=true
NEXT_PUBLIC_FEATURE_STUDY_MATERIALS=true
NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS=true
NEXT_PUBLIC_FEATURE_VIDEOS=true

# ── ALSO PUSHED by Portal "Push Env Vars" ──────────────────────────────────
NEXT_PUBLIC_TENANT_SLUG=sharma
NEXT_PUBLIC_APP_URL=https://sharma.cipherlearn.vercel.app
```

### 3C. Admin Portal Backend — Render

```bash
PORT=5001
DB_URL=postgresql://...          # cipherlearnadmin on Aiven
CLIENT_DB_URL=postgresql://...   # defaultdb on Aiven (cross-DB provisioning)
SUPER_ADMIN_JWT_SECRET=<openssl rand -hex 32>
ENCRYPTION_KEY=<openssl rand -hex 32>   # REQUIRED: encrypts ALL secrets in PlatformConfig + ClassConfig

# ── Global Hosting API Keys (DEVELOPMENT / TESTING only) ────────────────────────────────────
# In PRODUCTION: every class stores their own credentials via portal (Section 3D).
# Global keys here are only used as fallback if a class has no portal credentials set.
# Leave these EMPTY in production — all production ops go through per-class credentials.
VERCEL_TOKEN=
RENDER_API_KEY=
AIVEN_TOKEN=
AIVEN_PROJECT=
```

---

### 3D. Per-Class Platform Credentials (Portal DB — AES-256-GCM Encrypted)

Each class can store its **own** platform API credentials in the portal. These override the
global `.env` tokens above for **all** hosting operations involving that class (resource
listing, status refresh, push env vars, etc.).

Stored in the `class_config` table via `ConfigService.upsertClass()`. Secrets encrypted
with `ENCRYPTION_KEY` (AES-256-GCM). Never exposed in API responses.

| Config Key | What it stores | Secret |
|---|---|---|
| `hosting.vercel.token` | Vercel personal access token for this class | yes |
| `hosting.render.apiKey` | Render API key for this class | yes |
| `hosting.aiven.token` | Aiven API token for this class | yes |
| `hosting.aiven.project` | Aiven project name (e.g. `sharma-coaching`) | no |

**How to set them:**
Portal → Classes → [class name] → Infrastructure tab → **Platform Credentials** section
→ Click the form for each platform → enter token → Save

**Priority order for every hosting API call:**
```
1. Class credential from portal DB (class_config table)
2. Global .env token (VERCEL_TOKEN / RENDER_API_KEY / etc.)
3. Error thrown: "Not configured"
```

**Practical guidance:**
- Dev / single-tenant: set global `.env` tokens — all classes share one account
- Production multi-tenant: each class owner provides their own tokens via portal
- Mixing is fine — set global as fallback, add per-class where isolation is needed

---

## 4. Testing Data (Ready to Copy-Paste)

Use this exact data when running your from-scratch test.

### The Test Class

```
Class Name:    Sharma Coaching Academy
Slug:          sharma
Owner Name:    Rahul Sharma
Contact Email: rahul@sharma.com
Contact Phone: +91 9876543210
Address:       123 MG Road, Pune 411001
Website:       https://sharma.com
Plan:          STARTER
Primary Color: #0F766E
Accent Color:  #F59E0B
Logo Initials: SA
```

### Admin Credentials (set in ADMIN_EMAILS env var)

```
Admin Email:    rahul@sharma.com
Admin Password: Admin@1234
```

### Test Teacher

```
Name:    Priya Verma
Email:   priya.teacher@sharma.com
Phone:   +91 9876543211
Subject: Physics
```
Teacher app password (set on first login): `Teacher@1234`

### Test Students (enroll all 3)

```
Student 1:
  Name:  Arjun Mehta
  Email: arjun@student.com
  Phone: 9876540001
  App Password: Student@1234

Student 2:
  Name:  Sneha Patel
  Email: sneha@student.com
  Phone: 9876540002
  App Password: Student@1234

Student 3:
  Name:  Rohan Gupta
  Email: rohan@student.com
  Phone: 9876540003
  App Password: Student@1234
```

### Test Batch

```
Name:     Batch A — Science 2024
Subjects: Physics, Chemistry, Mathematics
Schedule: Mon / Wed / Fri, 4:00 PM – 6:00 PM
Start:    Today's date
End:      3 months from today
Capacity: 30 students
```

### Test Fee Structure

```
Batch:       Batch A — Science 2024
Type:        Monthly
Amount:      ₹2500
Due Day:     5
Description: Monthly tuition fee
```

### Test Lecture

```
Title:    Introduction to Newton's Laws
Batch:    Batch A — Science 2024
Teacher:  Priya Verma
Date:     Tomorrow
Time:     4:00 PM
Duration: 2 hours
Topic:    Motion and Force
```

### Test Assignment

```
Title:        Newton's Laws Problem Set
Batch:        Batch A — Science 2024
Due Date:     7 days from today
Max Marks:    50
Description:  Solve all 10 problems from Chapter 5
```

### Test Announcement

```
Title:    Parent-Teacher Meeting
Category: EVENT
Priority: HIGH
Content:  Parent-Teacher meeting on Saturday 10 AM at school premises.
          All parents are requested to attend.
```

### Test Fee Receipt (for Arjun Mehta)

```
Student:   Arjun Mehta
Amount:    ₹2500
Mode:      UPI
Reference: UPI20240115001
Status:    PAID
Date:      Today
Notes:     January 2024 tuition
```

---

## 5. From-Scratch Setup: Phase 1 — Admin Portal + Class Creation

### Step 1 — Reset & Migrate Admin DB

```bash
# On Aiven: drop and recreate cipherlearnadmin DB if needed
# Then generate the Prisma client and run migrations:
cd admin/backend
npx prisma generate     # regenerate client from schema (always run after schema changes)
npm run prisma:m:d      # dev migration (creates tables with new names: classes, class_config, etc.)
# or for production:
npx prisma migrate deploy
```

**Admin DB table names (as of v2):**
| Prisma model | DB table |
|---|---|
| `Classroom` | `classes` |
| `ClassConfig` | `class_config` |
| `ClassHosting` | `class_hosting` |
| `ClassQuotaOverride` | `class_quota_overrides` |
| `ClassEnvVar` | `class_env_vars` (NEW) |
| `Payment` | `payments` |
| `AdminAuditLog` | `admin_audit_logs` |

### Step 2 — Start Admin Portal

```bash
# Terminal 1
cd admin/backend && npm run start:dev

# Terminal 2
cd admin/frontend && npm run dev
```

### Step 3 — Seed the First Super Admin (one-time ever)

```bash
curl -X POST http://localhost:5001/api/portal/auth/seed \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CipherLearn Owner",
    "email": "owner@cipherlearn.com",
    "password": "Owner@1234"
  }'
```
Expected: `{ "success": true, "data": { "token": "eyJ..." } }`

### Step 4 — Login to Admin Portal

Open `http://localhost:3001/login`
- Email: `owner@cipherlearn.com`
- Password: `Owner@1234`

### Step 5 — Add Platform API Keys in Settings

Portal → Settings → (add these in the relevant categories)

**Hosting API keys — set in `admin/backend/.env` (global fallback for all classes):**
```
VERCEL_TOKEN      = your-vercel-api-token
RENDER_API_KEY    = your-render-api-key
AIVEN_TOKEN       = your-aiven-api-token
AIVEN_PROJECT     = your-aiven-project-name
```

For per-class credentials (preferred in production), use the portal instead — see Section 3D and Phase 2 Step 9C.

### Step 6 — Create the Test Class

Portal → Classes → New Class

Fill using the testing data from Section 4:
```
Name:          Sharma Coaching Academy
Slug:          sharma
Owner Name:    Rahul Sharma
Contact Email: rahul@sharma.com
Plan:          STARTER
Primary Color: #0F766E
Accent Color:  #F59E0B
Logo Initials: SA
Feature Flags: all ON
```

Click Create. On the success screen:
- **Copy the admin email + temporary password** — you'll need these
- The portal also UPSERTs `rahul@sharma.com` into the client DB (defaultdb) with `isPasswordSet=false`

### Step 7 — Verify Cross-DB Provisioning

```bash
# This should succeed (user exists in client DB via cross-DB UPSERT)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rahul@sharma.com","password":"<temp_password_from_portal>"}'
```

### Step 8 — Explore the Class Detail Page

Portal → Classes → Sharma Coaching Academy

Tabs to verify:
- **Overview** — shows class info, plan, status, quotas
- **Branding** — logo, colors, feature flags
- **Subscription** — plan, dates
- **Payments** — empty for now
- **Infrastructure** — no resources yet
- **Settings** — config key-value pairs

---

## 6. From-Scratch Setup: Phase 2 — Hosting (Vercel + Render + Aiven)

> **Model:** Class owner creates accounts on Vercel, Render, Aiven, Cloudinary with their
> own email. They give you API credentials. You store them in the portal and manage
> everything from there. Their platforms pull code from your **public** GitHub repos.

### Step 8B — Class Owner Creates Platform Accounts (they do this once)

Guide the class owner (or do it with them) to create these accounts:

| Platform | URL | What to create | Credential to get |
|---|---|---|---|
| Vercel | vercel.com | Account → Settings → Tokens → Create (full access) | Personal Access Token |
| Render | render.com | Account → Settings → API Keys → Create | API Key |
| Aiven | aiven.io | Account → User Information → Authentication → Generate token | API Token |
| Aiven | (same) | Create PostgreSQL service → note the service name | Service Name + DB URL |
| Cloudinary | cloudinary.com | Free account → Dashboard | Cloud Name + API Key + API Secret |

**You receive from them:** Vercel PAT, Render API Key, Aiven Token, Aiven Service Name,
Aiven DB connection URL, Cloudinary credentials.

### Step 9A — Add Custom Env Variables (optional, before provisioning)

Portal → Classes → Sharma → Infrastructure tab → **Env Variables** section

Use this to store any extra vars the class needs (payment gateways, analytics, etc.).
Each var is pushed automatically when you click "Push to All".

**Example vars to add for a payment-enabled class:**
```
Key:    RAZORPAY_KEY_ID       Value: rzp_live_xxx   Target: RENDER   Secret: no
Key:    RAZORPAY_KEY_SECRET   Value: abc123xyz       Target: RENDER   Secret: yes ✓
Key:    NEXT_PUBLIC_RAZORPAY_KEY_ID  Value: rzp_live_xxx  Target: VERCEL  Secret: no
```

Secrets are AES-256-GCM encrypted in the DB and never shown again after save.

### Step 9 — Add Cloudinary Credentials

Portal → Classes → Sharma → Infrastructure tab → **Cloudinary** section

```
Cloud Name:  your-cloudinary-cloud-name
API Key:     your-cloudinary-api-key
API Secret:  your-cloudinary-api-secret
```
Click Save Credentials. Encrypted in DB. Will be auto-pushed to Render on "Push to All".

### Step 9C — Store Their API Credentials in Portal (REQUIRED)

Portal → Classes → Sharma → Infrastructure tab → **Platform Credentials** section

Using credentials collected in Step 8B:

```
Vercel:   Personal Access Token       → enter → Save
Render:   API Key                     → enter → Save
Aiven:    API Token + Project/Account → enter both → Save
```

All tokens are AES-256-GCM encrypted in the portal DB. Never stored in plain text.

These are used by the portal for ALL operations on this class:
- Listing their Vercel projects / Render services / Aiven services
- Refreshing resource status cards
- Pushing env vars to their Vercel and Render
- Any future portal operations on their infrastructure

Skip this step if using the global `.env` tokens (fine for single-account setup).

### Step 10 — Class Owner Creates Infrastructure (on THEIR accounts)

**Done by the class owner** (or you do it together using their login). Each service is
on their personal Vercel/Render/Aiven account — their billing, their ownership.

**A. Create Vercel Project** *(logged into THEIR Vercel account)*
1. Vercel dashboard → Add New → Project → **Import Git Repository**
2. Paste URL: `https://github.com/your-org/client-frontend` (your PUBLIC repo)
3. Vercel detects Next.js automatically — no GitHub App install needed (public repo)
4. Project name: `cipherlearn-sharma`
5. Don't set env vars now — portal handles this
6. Click Deploy → note the **Project URL**: `https://cipherlearn-sharma.vercel.app`
7. Settings → General → note the **Project ID**

**B. Create Render Web Service** *(logged into THEIR Render account)*
1. Render dashboard → New → Web Service
2. Select **"Public Git repository"** → paste: `https://github.com/your-org/client-backend`
3. No GitHub account connection needed — Render supports direct public URL import
4. Name: `cipherlearn-sharma-api`, Language: `Node`, Branch: `main`
5. Build command: `npm install && npm run build`
6. Start command: `npx prisma migrate deploy && node dist/index.js`
7. Plan: **Starter ($7/mo)** — NEVER free tier (sleeps after 15 min inactivity)
8. Click Create → note the **Service URL**: `https://cipherlearn-sharma-api.onrender.com`
9. Dashboard URL → note the **Service ID** (`srv-xxxxxxxxxxxx`)

**C. Aiven PostgreSQL** *(was already done in Step 8B — just retrieve the connection info)*
1. Aiven console → their PostgreSQL service → Overview tab
2. Note the **Service URI** (full `postgresql://...` connection string with `?sslmode=require`)
3. Note the **Service Name** (e.g. `pg-sharma-coaching`)
4. If Hobbyist plan (1 free service per account): service already exists from Step 8B.
   The DB name is `defaultdb` — connection URL ends in `/defaultdb?sslmode=require`

### Step 11 — Link Resources in Portal

Portal → Classes → Sharma → Infrastructure tab → **Link Resource** button (per platform)

For each resource created in Step 10:

| Platform | Resource Type | ID to enter | Name | URL |
|---|---|---|---|---|
| VERCEL | `frontend` | Vercel Project ID | `cipherlearn-sharma` | `https://cipherlearn-sharma.vercel.app` |
| RENDER | `web_service` | Render Service ID (`srv-xxx`) | `cipherlearn-sharma-api` | `https://cipherlearn-sharma-api.onrender.com` |
| AIVEN | `pg` | Service name (`cipherlearn-sharma-db`) | `cipherlearn-sharma-db` | *(leave blank)* |

After linking, the infrastructure cards appear in the portal with status dots.
Click **Refresh Status** on each card to pull live status from the platform APIs.

### Step 12 — Push Env Vars

Portal → Classes → Sharma → Infrastructure tab → **"Push to All"** button

This auto-computes and pushes vars derived from linked resources + all stored ClassEnvVars:

```
→ Vercel gets:  NEXT_PUBLIC_TENANT_SLUG, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL
                + any ClassEnvVar with target=VERCEL or BOTH

→ Render gets:  NEXT_PUBLIC_TENANT_SLUG, NEXT_PUBLIC_APP_URL, DATABASE_URL (from Aiven),
                NEXT_PUBLIC_API_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
                CLOUDINARY_API_SECRET (from Cloudinary section, if set)
                + any ClassEnvVar with target=RENDER or BOTH
```

**Note on Vercel:** env var changes do NOT trigger a redeploy automatically. After pushing,
go to Vercel dashboard → project → Deployments → Redeploy latest.

### Step 13 — Set Remaining Env Vars on Render (manual)

Render dashboard → cipherlearn-sharma-api → Environment

These are NOT auto-pushed — set them manually:

```bash
APP_PORT=5000
APP_HOST=0.0.0.0
NODE_ENV=production
CLIENT_URL=https://cipherlearn-sharma.vercel.app
SALT=10
ADMIN_EMAILS=rahul@sharma.com
JWT_SECRET=<paste: openssl rand -hex 32 output>
JWT_EXPIRES_IN=1h
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
QR_SECRET=<paste: openssl rand -hex 16 output>
CLASS_NAME=Sharma Coaching Academy
CLASS_LOGO_URL=
PRIMARY_COLOR=#0F766E
ACCENT_COLOR=#F59E0B
FEATURE_QR_ATTENDANCE=true
FEATURE_FEES=true
FEATURE_ASSIGNMENTS=true
FEATURE_STUDY_MATERIALS=true
FEATURE_ANNOUNCEMENTS=true
FEATURE_VIDEOS=true
NODE_MAILER_HOST=smtp.gmail.com
NODE_MAILER_PORT=587
NODE_MAILER_USER=noreply@sharma.com
NODE_MAILER_PASSWORD=<gmail-app-password>
NODE_MAILER_FROM_EMAIL=noreply@sharma.com
NODE_MAILER_FROM_NAME=Sharma Coaching Academy
```

After saving → Render auto-redeploys. Wait for deploy to complete.

### Step 14 — Set Remaining Env Vars on Vercel (manual)

Vercel dashboard → cipherlearn-sharma → Settings → Environment Variables

```bash
NEXT_PUBLIC_APP_NAME=Sharma Coaching Academy
NEXT_PUBLIC_APP_TAGLINE=Empowering Students
NEXT_PUBLIC_APP_DESCRIPTION=Complete platform for Sharma Academy.
NEXT_PUBLIC_LOGO_URL=
NEXT_PUBLIC_LOGO_INITIALS=SA
NEXT_PUBLIC_PRIMARY_COLOR=#0F766E
NEXT_PUBLIC_ACCENT_COLOR=#F59E0B
NEXT_PUBLIC_CONTACT_EMAIL=rahul@sharma.com
NEXT_PUBLIC_FEATURE_QR_ATTENDANCE=true
NEXT_PUBLIC_FEATURE_FEES=true
NEXT_PUBLIC_FEATURE_ASSIGNMENTS=true
NEXT_PUBLIC_FEATURE_STUDY_MATERIALS=true
NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS=true
NEXT_PUBLIC_FEATURE_VIDEOS=true
```

After saving → Vercel → Deployments → Redeploy latest (required — Vercel doesn't auto-deploy on env var change).

### Step 15 — Smoke Test Infrastructure

```bash
# Backend alive?
curl https://cipherlearn-sharma-api.onrender.com/

# Public settings endpoint returns branding?
curl https://cipherlearn-sharma-api.onrender.com/api/app/settings | python -m json.tool

# Verify in response:
#   data.branding.primaryColor = "#0F766E"
#   data.features.fees = true
#   data.class.name = "Sharma Coaching Academy"  (after Step 18 below)

# Frontend loads?
# Open: https://cipherlearn-sharma.vercel.app
# Login panel should show "Sharma Coaching Academy" with #0F766E gradient
```

---

## 7. From-Scratch Setup: Phase 3 — Class Admin Dashboard + Feature Testing

### Step 16 — DB Migration (if not in startCommand)

If `provision.render.startCommand` was set to `npx prisma migrate deploy && npm start`,
this already ran on deploy. Verify by checking Render logs — look for:
```
Running migrations...
All migrations applied successfully.
```

If not there, run manually via Render Shell:
```bash
npx prisma migrate deploy
```

### Step 17 — Admin Signup

Open: `https://cipherlearn-sharma.vercel.app/signup`

```
Name:     Rahul Sharma
Email:    rahul@sharma.com        ← must match ADMIN_EMAILS
Password: Admin@1234
```

Submit → should redirect to dashboard.

If you get "Only admin accounts can be created through this endpoint" →
check that `ADMIN_EMAILS=rahul@sharma.com` is set on Render and service restarted.

### Step 18 — Configure Class Profile

Dashboard → Settings → Class Profile

```
Class Name:    Sharma Coaching Academy
Email:         info@sharma.com
Phone:         +91 9876543210
Address:       123 MG Road, Pune 411001
Website:       https://sharma.com
```
Save.

Now re-verify public endpoint:
```bash
curl https://cipherlearn-sharma-api.onrender.com/api/app/settings | python -m json.tool
# data.class.name should now be "Sharma Coaching Academy"
```

### Step 19 — Create Batch

Dashboard → Classes (or Batches) → New Batch
Use data from Section 4 (Batch A — Science 2024).

### Step 20 — Enroll Students

Dashboard → Students → Add Student (x3)
Enroll Arjun, Sneha, and Rohan using data from Section 4.
Assign all to "Batch A — Science 2024".

Test CSV import (optional):
- Dashboard → Students → CSV Template → download
- Fill 3 more test students
- Import CSV → Preview → Confirm

### Step 21 — Add Teacher

Dashboard → Teachers → Add Teacher
Use Priya Verma data from Section 4.

Expected: Priya receives an account registration email (verify SMTP config).
Email should arrive at `priya.teacher@sharma.com`.

### Step 22 — Create a Lecture

Dashboard → Lectures → New Lecture
Use test lecture data from Section 4.
Assign to Priya Verma.

### Step 23 — Mark Attendance

Dashboard → Attendance → Mark Attendance

Select "Batch A — Science 2024" + today's date.
Mark: Arjun = PRESENT, Sneha = PRESENT, Rohan = ABSENT.
Save.

Verify in history:
Dashboard → Attendance → History → select batch + date → confirm records.

### Step 24 — Fee Management

Dashboard → Fees → Fee Structures → New Structure
Use fee structure data from Section 4.

Create receipt:
Dashboard → Fees → New Receipt
Use test receipt data from Section 4 (for Arjun Mehta, ₹2500, PAID).

Verify:
Dashboard → Fees → All Receipts → Arjun should appear with PAID status.

### Step 25 — Create Assignment

Dashboard → Assignments → New Assignment
Use assignment data from Section 4.
Upload a test PDF file.

### Step 26 — Create Announcement

Dashboard → Announcements → New
Use announcement data from Section 4 (Parent-Teacher Meeting, HIGH priority).

### Step 27 — Create Test

Dashboard → Tests → New Test
```
Title:       Physics Unit Test 1
Batch:       Batch A — Science 2024
Date:        Next week
Total Marks: 100
Type:        Written
```

### Step 28 — Verify Admin Logout & Re-login

Click Logout → should redirect to /login.

Verify token is blacklisted:
Try using the old token → should get 401. (Or just verify redirect happened.)

Re-login → works → token blacklist confirmed working.

---

## 8. The App (Student/Teacher Web App) — Config Guide

The student/teacher app IS the client frontend deployed on Vercel.
There is no separate React Native app — it's a responsive web app.

### How the App Gets Its Configuration

```
┌─────────────────────────────────────────────────────────┐
│  Mobile browser / Desktop opens Vercel URL               │
│  https://cipherlearn-sharma.vercel.app                   │
│                                                         │
│  1. Loads JavaScript bundle (baked at build time)        │
│     └→ siteConfig.ts has: appName, colors, API URL       │
│     └→ These are fixed until next Vercel redeploy        │
│                                                         │
│  2. Before login: app fetches GET /api/app/settings      │
│     └→ Returns: branding + features + teacherPermissions │
│     └→ THIS is how feature flags reach the app at runtime│
│                                                         │
│  3. Student logs in → JWT stored in Redux + localStorage │
│     └→ Every API call: Authorization: Bearer <token>     │
│     └→ 401 on any call → clears storage → back to /login │
└─────────────────────────────────────────────────────────┘
```

### Student First-Time Flow (via browser)

```bash
# Step A: Check if enrolled (before setting password)
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/check-enrollment \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@student.com"}'
# Expected: {"data":{"enrolled":true,"studentId":1}}

# Step B: Set password on first use
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/setup-password \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@student.com","password":"Student@1234"}'
# Expected: {"success":true}

# Step C: Login
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@student.com","password":"Student@1234"}'
# Expected: {"data":{"user":{...},"token":"eyJ..."}}

# Save the token:
export STUDENT_TOKEN=<token from above>
```

### What the Student App Can Access

```bash
# Attendance history
curl https://cipherlearn-sharma-api.onrender.com/api/app/attendance \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Attendance calendar (for a month)
curl "https://cipherlearn-sharma-api.onrender.com/api/app/attendance/calendar?month=1&year=2024" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Fee receipts
curl https://cipherlearn-sharma-api.onrender.com/api/app/fees/receipts \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Fee summary
curl https://cipherlearn-sharma-api.onrender.com/api/app/fees/summary \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Assignments pending
curl "https://cipherlearn-sharma-api.onrender.com/api/app/assignments?status=pending" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Announcements
curl https://cipherlearn-sharma-api.onrender.com/api/app/announcements \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Study materials
curl "https://cipherlearn-sharma-api.onrender.com/api/app/resources/study-materials" \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Test scores
curl https://cipherlearn-sharma-api.onrender.com/api/app/tests \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Today's lectures
curl https://cipherlearn-sharma-api.onrender.com/api/app/dashboard/today-lectures \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### Student Forgot Password Flow (tests email)

```bash
# Request OTP (sends email to arjun@student.com)
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@student.com"}'
# Check inbox for OTP

# Verify OTP
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@student.com","otp":"<OTP from email>"}'
# Returns reset token

# Reset password
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"<reset_token>","newPassword":"NewPass@1234"}'
```

### Teacher App Flow

```bash
# Teacher first login (same setup-password flow)
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/setup-password \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.teacher@sharma.com","password":"Teacher@1234"}'

curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya.teacher@sharma.com","password":"Teacher@1234"}'

export TEACHER_TOKEN=<token>

# Mark attendance via app (teacher route)
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/attendance/teacher/mark \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchId":1,"date":"2024-01-20","records":[
    {"studentId":1,"status":"PRESENT"},
    {"studentId":2,"status":"PRESENT"},
    {"studentId":3,"status":"ABSENT"}
  ]}'

# Post announcement
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/announcements/teacher \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Holiday Notice","content":"No class Saturday","category":"HOLIDAY","priority":"MEDIUM"}'

# View student doubts
curl "https://cipherlearn-sharma-api.onrender.com/api/app/doubts/teacher?status=OPEN" \
  -H "Authorization: Bearer $TEACHER_TOKEN"
```

### Testing Token Revocation

```bash
# Logout (blacklists the token)
curl -X POST https://cipherlearn-sharma-api.onrender.com/api/app/auth/logout \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# Try using revoked token — must return 401
curl https://cipherlearn-sharma-api.onrender.com/api/app/attendance \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# Expected: {"success":false,"message":"Token has been revoked"}
```

---

## 9. What Push Env Vars Does vs What Stays Manual

Understanding this gap is critical for setup time estimation.

| Variable | Auto-Pushed by Portal | Platform | Manual |
|---|---|---|---|
| `DATABASE_URL` | ✅ (from Aiven) | Render | |
| `NEXT_PUBLIC_API_URL` | ✅ (from Render URL) | Vercel | |
| `NEXT_PUBLIC_TENANT_SLUG` | ✅ | Vercel + Render | |
| `NEXT_PUBLIC_APP_URL` | ✅ | Vercel + Render | |
| `CLOUDINARY_CLOUD_NAME` | ✅ (if set in Infra tab) | Render | |
| `CLOUDINARY_API_KEY` | ✅ (if set in Infra tab) | Render | |
| `CLOUDINARY_API_SECRET` | ✅ (if set in Infra tab) | Render | |
| Any `ClassEnvVar` key | ✅ (stored in portal Env Vars) | Per target | Add via Infra tab |
| `JWT_SECRET` | ❌ | Render | Set manually |
| `SALT` | ❌ | Render | Set manually |
| `ADMIN_EMAILS` | ❌ | Render | Set manually |
| `CLIENT_URL` | ❌ | Render | Set manually |
| `CLASS_NAME` | ❌ | Render | Set manually |
| `PRIMARY_COLOR` | ❌ | Render | Set manually |
| `FEATURE_*` | ❌ | Render | Set manually |
| `NODE_MAILER_*` | ❌ | Render | Set manually |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Vercel | Set manually |
| `NEXT_PUBLIC_PRIMARY_COLOR` | ❌ | Vercel | Set manually |
| `NEXT_PUBLIC_FEATURE_*` | ❌ | Vercel | Set manually |

**Time estimate for manual vars:** ~5 minutes per class (copy-paste from a template).

**Portal-stored vars (ClassEnvVar):** Any key-value pair added via Infrastructure tab →
Env Variables is automatically included in the next "Push to All". Target determines which
platforms receive it (VERCEL / RENDER / BOTH). Secrets are encrypted at rest.

**Future improvement:** Extend `pushEnvVarsToClass()` to also auto-push branding + feature
flag vars from the Classroom record. The data is already in the DB — just not wired yet.

---

## 10. Infrastructure Ownership — Critical Mental Model

**Each coaching class owns their own infrastructure accounts.** You manage and configure
everything via the portal using their stored API credentials.

```
YOUR GitHub repos (PUBLIC) ──────────────────────────────────────────────────────────┐
  github.com/your-org/client-frontend   (Next.js — public repo)                     │
  github.com/your-org/client-backend    (Express — public repo)                     │
                                                                                     │
  Why public? Vercel/Render cannot connect ONE private repo to MULTIPLE different    │
  accounts. Making repos public removes all cross-account restrictions entirely.     │
  Both platforms support direct public URL import — no GitHub App install needed.   │
  The value of CipherLearn is the portal + ops system, not the client source code.  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                    ↓  they connect to your public repo URL
SHARMA's Vercel     →  1 project (client-frontend) — their billing, their account
SHARMA's Render     →  1 web service (client-backend) — their billing, their account
SHARMA's Aiven      →  1 PostgreSQL service/DB — their billing, their account
SHARMA's Cloudinary →  1 cloud account (file uploads) — their billing, their account
                    ↓
YOUR portal stores their API keys encrypted → pushes env vars → refreshes status

Sharma Classes gets:  their own app URL + their own platform accounts + login creds.
                      They pay Vercel/Render/Aiven directly. You charge for the portal service.
```

**When you push to `main` on your GitHub:**
→ Every class's Vercel auto-deploys the frontend update
→ Every class's Render auto-deploys the backend update
→ Zero manual work — all classes always run your latest code

**Required: both GitHub repos must be PUBLIC.** Private repos cannot be connected
to multiple different Vercel/Render accounts. This is a platform constraint, not a choice.

---

## 11. Known Issues, Pain Points & Fixes

### 11A. Pre-Sale Blockers (fix before charging money)

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | ~~Email templates hardcode "CipherLearn" branding~~ | `client/backend/src/utils/email.ts` | ✅ Fixed: all 4 email functions now use `config.CLASS.NAME`, `config.CLASS.PRIMARY_COLOR`, `config.CLASS.ACCENT_COLOR` |
| 2 | **Render free tier sleeps after 15 min** — 60s cold-start for students on login | Class backend on Render free tier | Class owner must select **Starter plan ($7/mo)** when creating their Render service (Step 10B). Communicate this cost upfront. Free tier is not viable for a live student-facing app. |
| 3 | JWT_SECRET defaults to `"your_jwt_secret"` — token forgery risk | `client/backend/src/config/env.config.ts:28` | Always set strong `JWT_SECRET` on Render: `openssl rand -hex 32`. Never leave default. |
| 4 | Render start command must be production binary | Render service start command | Use `npx prisma migrate deploy && node dist/index.js` — NOT `tsx watch` which is dev-only |
| 5 | `ADMIN_EMAILS` empty = nobody can sign up as admin | `client/backend/.env` | Must set `ADMIN_EMAILS=owner@client.com` on Render before handing over credentials |

### 11B. Architecture / SaaS Ops Pain Points

| # | Issue | Impact | Fix |
|---|---|---|---|
| 6 | ~15 Render env vars still set manually per class | 15-30 min setup time per class | Store all as `ClassEnvVar` via portal Env Variables section → "Push to All" sends them. See Section 9 gap table. |
| 7 | Vercel env var change requires **manual redeploy** | Env push doesn't trigger new build | After "Push to All" → Vercel dashboard → project → Deployments → Redeploy latest |
| 8 | Aiven Hobbyist plan = **1 free service per account** | Cannot create isolated DB per class for free | Use shared Aiven service, create a new **database** per class inside it (Aiven console → Databases tab → Create DB). Upgrade to paid plan when scaling. |
| 9 | Per-class platform credentials not set | All hosting ops use global `.env` fallback | Portal → Class → Infrastructure → Platform Credentials → add per-class Vercel/Render/Aiven tokens |
| 10 | Teacher API permissions not enforced in backend | Teacher with `canViewFees=false` can call `GET /api/dashboard/fees` directly | Add `req.teacher.permissions` check to each teacher route middleware. Frontend enforcement only for now. |
| 11 | Auth middleware didn't check DB | Old JWT after DB reset caused FK crashes | Fixed: middleware now calls `prisma.superAdmin.findUnique` on every request |
| 12 | Audit logs crashed class creation | `adminAuditLog.create` was fatal | Fixed: wrapped in non-fatal `audit()` helper |

### 11C. Client App Pain Points (fix before broad launch)

| # | Issue | File | Fix |
|---|---|---|---|
| 13 | ~~Prisma query logs flood Render in production~~ | `client/backend/src/config/db.config.ts` | ✅ Fixed: `defaultQueryLogger` now returns early if `NODE_ENV === "production"` |
| 14 | ~~Duplicate DB connection on startup~~ | `client/backend/src/config/db.config.ts` | ✅ Fixed: singleton `db` exported from db.config.ts; index.ts imports it instead of `new Database()` |
| 15 | Teacher permissions frontend-only — no API enforcement | `client/backend` all teacher routes | Add `req.teacher.permissions` middleware check on each teacher route. Frontend-only enforcement is unsafe. |
| 16 | ~~Admin password reset emails raw JWT (not a link)~~ | `client/backend/src/utils/email.ts` | ✅ Fixed: `sendAdminPasswordResetEmail` now renders a clickable reset link (`CLIENT_URL/reset-password?token=…`) when `CLIENT_URL` is set; falls back to raw token if not set |

### 11D. Scaling Pain Points (address at 10+ clients)

| # | Issue | Fix |
|---|---|---|
| 17 | Each class needs ~15 manual Render env vars | Store all as `ClassEnvVar` via portal → "Push to All" sends them in one call |
| 18 | Client app updates require re-deploying all classes | Push to `CipherLearn-Client` main branch → all Vercel/Render services with auto-deploy pick it up automatically |
| 19 | Aiven Hobbyist shared service bottleneck | Upgrade to paid Aiven plan; create 1 isolated PG service per class via Aiven console |
| 20 | Branding (CLASS_NAME, colors) not auto-pushed to Render | Add as `ClassEnvVar` (target=RENDER) once via Infrastructure Env Vars → push handles it each time |
| 21 | No payment gateway in client app | Classes track fees manually (mark paid). Integrate Razorpay for online collection before broad launch. |

---

## 12. Was Previously "Known Issues"

| # | Issue | Severity | Status |
|---|---|---|---|
| A | SALT had no default | 🔴 Blocker | ✅ Fixed |
| B | Dashboard logout was no-op | 🔴 Blocker | ✅ Fixed |
| C | Admin reset returned token in response | 🔴 Blocker | ✅ Fixed |
| D | CLOUDINAIRY typo in env.config.ts | 🟢 Minor | Open (cosmetic — env var names are correct, runtime unaffected) |
| E | N+1 API calls in portal RequiredVarsPanel | 🟡 Medium | ✅ Fixed: single `POST /env-vars/batch` call |
| F | Render link modal duplicate key `""` | 🟡 Medium | ✅ Fixed: unwrap `item.service` before reading `id` |
| G | Aiven 404 on all calls (double `/v1/` in URL) | 🔴 Blocker | ✅ Fixed: Axios baseURL changed from `https://api.aiven.io/v1` to `https://api.aiven.io` |
| H | Per-class platform credentials | 🟠 High | ✅ Added: encrypted in ClassConfig, portal UI in Infrastructure tab |

---

*Architecture: Per-deployment isolation — no shared DB, no tenantId*
*Portal: `admin/` | Template app: `client/`*
*Last updated: 2026-03-06 (v3 — Auto-Provision removed, per-class credentials added, Render sleep warning, infrastructure ownership corrected: THEIR accounts via public GitHub repos)*
