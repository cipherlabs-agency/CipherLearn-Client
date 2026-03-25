import { cacheService } from "./index";
import { InvalidationPatterns, AppKeys } from "./keys";

/**
 * Invalidate caches affected by attendance mutations.
 */
export function invalidateAfterAttendanceMutation(
  batchId?: number,
  studentIds?: number[]
): void {
  // Dashboard analytics (trends, stats)
  cacheService.delByPrefix(InvalidationPatterns.dashAnalytics);

  // App attendance for specific students
  if (studentIds && studentIds.length > 0) {
    for (const sid of studentIds) {
      cacheService.delByPrefix(`app:attendance:perf:${sid}`);
      cacheService.delByPrefix(`app:attendance:calendar:${sid}`);
    }
  } else {
    // If no specific students, clear all app attendance
    cacheService.delByPrefix(InvalidationPatterns.appAttendance);
  }
}

/**
 * Invalidate caches affected by batch mutations.
 */
export function invalidateAfterBatchMutation(batchId?: number): void {
  cacheService.delByPrefix(InvalidationPatterns.dashBatches);
  cacheService.delByPrefix(InvalidationPatterns.dashAnalytics);
  cacheService.delByPrefix(InvalidationPatterns.dashStudents);
}

/**
 * Invalidate caches affected by student mutations.
 */
export function invalidateAfterStudentMutation(
  studentId?: number,
  batchId?: number
): void {
  cacheService.delByPrefix(InvalidationPatterns.dashStudents);
  cacheService.delByPrefix(InvalidationPatterns.dashAnalytics);

  if (studentId != null) {
    cacheService.del(AppKeys.profile(studentId));
  } else {
    cacheService.delByPrefix(InvalidationPatterns.appProfile);
  }
}

/**
 * Invalidate caches affected by announcement mutations.
 */
export function invalidateAfterAnnouncementMutation(): void {
  cacheService.delByPrefix(InvalidationPatterns.appAnnouncements);
}

/**
 * Invalidate caches affected by resource mutations (videos, notes, materials).
 */
export function invalidateAfterResourceMutation(): void {
  cacheService.delByPrefix(InvalidationPatterns.appResources);
}

/**
 * Invalidate caches affected by fee mutations.
 */
export function invalidateAfterFeesMutation(batchId?: number): void {
  if (batchId != null) {
    cacheService.del(AppKeys.feeStructures(batchId));
  } else {
    cacheService.delByPrefix(InvalidationPatterns.appFees);
  }
  // Always clear dashboard fee summary cache (summary changes with any payment)
  cacheService.delByPrefix(InvalidationPatterns.dashFees);
}
