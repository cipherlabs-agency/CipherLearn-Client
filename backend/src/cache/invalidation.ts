import { cacheService } from "./index";
import { InvalidationPatterns, AppKeys } from "./keys";

/**
 * Invalidate caches affected by attendance mutations.
 */
export function invalidateAfterAttendanceMutation(
  batchId?: number,
  studentIds?: number[]
): void {
  cacheService.delByPrefix(InvalidationPatterns.dashAnalytics());

  if (studentIds && studentIds.length > 0) {
    for (const sid of studentIds) {
      cacheService.delByPrefix(AppKeys.attendancePerf(sid, 0).replace(":0:", ":"));
      // Clear all attendance calendar entries for this student
      const prefix = AppKeys.attendancePerf(sid, 0).split(":perf:")[0] + ":calendar:" + sid;
      cacheService.delByPrefix(prefix);
    }
  } else {
    cacheService.delByPrefix(InvalidationPatterns.appAttendance());
  }
}

/**
 * Invalidate caches affected by batch mutations.
 */
export function invalidateAfterBatchMutation(batchId?: number): void {
  cacheService.delByPrefix(InvalidationPatterns.dashBatches());
  cacheService.delByPrefix(InvalidationPatterns.dashAnalytics());
  cacheService.delByPrefix(InvalidationPatterns.dashStudents());
}

/**
 * Invalidate caches affected by student mutations.
 */
export function invalidateAfterStudentMutation(
  studentId?: number,
  batchId?: number
): void {
  cacheService.delByPrefix(InvalidationPatterns.dashStudents());
  cacheService.delByPrefix(InvalidationPatterns.dashAnalytics());

  if (studentId != null) {
    cacheService.del(AppKeys.profile(studentId));
  } else {
    cacheService.delByPrefix(InvalidationPatterns.appProfile());
  }
}

/**
 * Invalidate caches affected by announcement mutations.
 */
export function invalidateAfterAnnouncementMutation(): void {
  cacheService.delByPrefix(InvalidationPatterns.appAnnouncements());
}

/**
 * Invalidate caches affected by resource mutations (videos, notes, materials).
 */
export function invalidateAfterResourceMutation(): void {
  cacheService.delByPrefix(InvalidationPatterns.appResources());
}

/**
 * Invalidate caches affected by fee mutations.
 */
export function invalidateAfterFeesMutation(batchId?: number): void {
  if (batchId != null) {
    cacheService.del(AppKeys.feeStructures(batchId));
  } else {
    cacheService.delByPrefix(InvalidationPatterns.appFees());
  }
}
