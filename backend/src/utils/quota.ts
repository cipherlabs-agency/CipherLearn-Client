import { prisma } from "../config/db.config";

export class QuotaError extends Error {
  statusCode = 403;
  code: string;

  constructor(message: string, code = "QUOTA_EXCEEDED") {
    super(message);
    this.name = "QuotaError";
    this.code = code;
  }
}

/**
 * Get the effective tenant with resolved quotas (override takes precedence).
 */
async function getEffectiveLimits(tenantId: number) {
  // Bypass tenant filter for this query — use raw prisma access
  const [tenant, override] = await Promise.all([
    (prisma as any).$queryRaw`
      SELECT "maxStudents","maxBatches","maxTeachers","maxStorageMB",
             "featureQRAttendance","featureAssignments","featureFees",
             "featureStudyMaterials","featureAnnouncements","featureVideos"
      FROM tenants WHERE id = ${tenantId}
    `.then((rows: any[]) => rows[0]),
    (prisma as any).$queryRaw`
      SELECT * FROM tenant_quota_overrides
      WHERE "tenantId" = ${tenantId}
        AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    `.then((rows: any[]) => rows[0] || null),
  ]);

  if (!tenant) throw new QuotaError("Tenant not found", "TENANT_NOT_FOUND");

  // Override values win when non-null
  return {
    maxStudents: override?.maxStudents ?? tenant.maxStudents,
    maxBatches: override?.maxBatches ?? tenant.maxBatches,
    maxTeachers: override?.maxTeachers ?? tenant.maxTeachers,
    maxStorageMB: override?.maxStorageMB ?? tenant.maxStorageMB,
    featureQRAttendance:
      override?.featureQRAttendance ?? tenant.featureQRAttendance,
    featureAssignments:
      override?.featureAssignments ?? tenant.featureAssignments,
    featureFees: override?.featureFees ?? tenant.featureFees,
    featureStudyMaterials:
      override?.featureStudyMaterials ?? tenant.featureStudyMaterials,
    featureAnnouncements:
      override?.featureAnnouncements ?? tenant.featureAnnouncements,
    featureVideos: override?.featureVideos ?? tenant.featureVideos,
  };
}

export async function checkStudentQuota(tenantId: number): Promise<void> {
  const limits = await getEffectiveLimits(tenantId);
  const count = await (prisma as any).$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM students
    WHERE "tenantId" = ${tenantId} AND "isDeleted" = false
  `.then((rows: any[]) => rows[0]?.cnt ?? 0);

  if (count >= limits.maxStudents) {
    throw new QuotaError(
      `Student quota reached (${count}/${limits.maxStudents}). Upgrade your plan to enroll more students.`,
      "QUOTA_EXCEEDED"
    );
  }
}

export async function checkBatchQuota(tenantId: number): Promise<void> {
  const limits = await getEffectiveLimits(tenantId);
  const count = await (prisma as any).$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM batches
    WHERE "tenantId" = ${tenantId} AND "isDeleted" = false
  `.then((rows: any[]) => rows[0]?.cnt ?? 0);

  if (count >= limits.maxBatches) {
    throw new QuotaError(
      `Batch quota reached (${count}/${limits.maxBatches}). Upgrade your plan to create more classes.`,
      "QUOTA_EXCEEDED"
    );
  }
}

export async function checkTeacherQuota(tenantId: number): Promise<void> {
  const limits = await getEffectiveLimits(tenantId);
  const count = await (prisma as any).$queryRaw`
    SELECT COUNT(*)::int AS cnt FROM users
    WHERE "tenantId" = ${tenantId} AND role = 'TEACHER'
  `.then((rows: any[]) => rows[0]?.cnt ?? 0);

  if (count >= limits.maxTeachers) {
    throw new QuotaError(
      `Teacher quota reached (${count}/${limits.maxTeachers}). Upgrade your plan to add more teachers.`,
      "QUOTA_EXCEEDED"
    );
  }
}

export type TenantFeatureKey =
  | "featureQRAttendance"
  | "featureAssignments"
  | "featureFees"
  | "featureStudyMaterials"
  | "featureAnnouncements"
  | "featureVideos";

export async function checkFeatureEnabled(
  tenantId: number,
  feature: TenantFeatureKey
): Promise<void> {
  const limits = await getEffectiveLimits(tenantId);
  if (!limits[feature]) {
    throw new QuotaError(
      `Feature "${feature}" is not available on your current plan. Please upgrade to access this feature.`,
      "FEATURE_NOT_AVAILABLE"
    );
  }
}
