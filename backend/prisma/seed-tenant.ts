/**
 * Migration Seed Script — Multi-Tenant Backfill
 *
 * Run this AFTER the Prisma migration that adds tenantId columns:
 *   npx ts-node prisma/seed-tenant.ts
 *
 * Steps:
 *   1. Insert the "default" tenant (id=1) if it doesn't exist
 *   2. Backfill tenantId=1 for all existing rows in tenant-scoped tables
 *   3. Print a summary
 *
 * This is idempotent — safe to run multiple times.
 */

import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DB_URL! });
const prisma = new PrismaClient({ adapter });

const TENANT_SCOPED_TABLES = [
  "users",
  "students",
  "batches",
  "attendances",
  "attendance_sheets",
  "qr_attendance_tokens",
  "youtube_videos",
  "notes",
  "assignment_slots",
  "student_submissions",
  "announcements",
  "study_materials",
  "fee_structures",
  "fee_receipts",
  "login_attempts",
  "lectures",
  "tests",
  "test_scores",
  "notification_preferences",
];

async function main() {
  console.log("🏗  Multi-tenant migration seed starting...\n");

  // ── Step 1: Create the default tenant ──────────────────────────────────────
  const existing = await (prisma as any).$queryRaw`
    SELECT id FROM tenants WHERE slug = 'default' LIMIT 1
  `;

  let tenantId: number;

  if (existing.length === 0) {
    const [tenant] = await (prisma as any).$queryRaw`
      INSERT INTO tenants (
        name, slug, "contactEmail", plan, "subscriptionStatus",
        "primaryColor", "accentColor", "logoInitials",
        "maxStudents", "maxBatches", "maxTeachers", "maxStorageMB",
        "featureQRAttendance", "featureAssignments", "featureFees",
        "featureStudyMaterials", "featureAnnouncements", "featureVideos",
        "createdAt", "updatedAt"
      ) VALUES (
        'Default Organization', 'default', 'admin@cipherlearn.com',
        'ENTERPRISE'::"TenantPlan", 'ACTIVE'::"SubscriptionStatus",
        '#0F766E', '#F59E0B', 'CL',
        999999, 999999, 999999, 999999,
        true, true, true, true, true, true,
        NOW(), NOW()
      )
      RETURNING id
    `;
    tenantId = tenant.id;
    console.log(`✅ Created default tenant with id=${tenantId}`);
  } else {
    tenantId = existing[0].id;
    console.log(`ℹ️  Default tenant already exists (id=${tenantId})`);
  }

  // ── Step 2: Backfill tenantId=1 for all existing records ───────────────────
  console.log(`\n📦 Backfilling tenantId=${tenantId} for all existing records...\n`);

  let totalUpdated = 0;

  for (const table of TENANT_SCOPED_TABLES) {
    try {
      const result = await (prisma as any).$executeRawUnsafe(
        `UPDATE "${table}" SET "tenantId" = $1 WHERE "tenantId" IS NULL`,
        tenantId
      );
      if (result > 0) {
        console.log(`  ✅ ${table}: ${result} rows updated`);
        totalUpdated += result;
      } else {
        console.log(`  ⚪ ${table}: already up-to-date`);
      }
    } catch (err: any) {
      console.warn(`  ⚠️  ${table}: ${err.message}`);
    }
  }

  console.log(`\n✅ Backfill complete — ${totalUpdated} rows updated across ${TENANT_SCOPED_TABLES.length} tables.`);
  console.log("\n🎉 Multi-tenant migration seed complete!\n");
  console.log("NEXT STEPS:");
  console.log("  1. Run a new migration to add NOT NULL constraints to tenantId columns");
  console.log("  2. Update auth service to include tenantId in login token payload");
  console.log("  3. Set DEFAULT_TENANT_SLUG=default in .env for single-tenant dev mode\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
