"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useTenantConfig } from "@/context/TenantConfig";

export interface TeacherPermissions {
  canManageLectures: boolean;
  canUploadNotes: boolean;
  canUploadVideos: boolean;
  canManageAssignments: boolean;
  canViewFees: boolean;
  canManageStudyMaterials: boolean;
  canSendAnnouncements: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

const DEFAULT_TEACHER_PERMISSIONS: TeacherPermissions = {
  canManageLectures: true,
  canUploadNotes: true,
  canUploadVideos: false,
  canManageAssignments: true,
  canViewFees: false,
  canManageStudyMaterials: false,
  canSendAnnouncements: true,
  canViewAnalytics: false,
  canExportData: false,
};

const ADMIN_PERMISSIONS: TeacherPermissions = {
  canManageLectures: true,
  canUploadNotes: true,
  canUploadVideos: true,
  canManageAssignments: true,
  canViewFees: true,
  canManageStudyMaterials: true,
  canSendAnnouncements: true,
  canViewAnalytics: true,
  canExportData: true,
};

/**
 * Returns the current user's resolved permissions.
 * - ADMIN: all permissions true
 * - TEACHER: reads from tenant's teacherPermissions JSON
 */
export function usePermissions(): TeacherPermissions {
  // TenantConfig is loaded from context but we need the raw JSON for teacher permissions.
  // For now we return defaults; the portal can update these via PATCH /tenants/:id/permissions.
  const role = useSelector((state: RootState) => state.auth.user?.role);

  if (role === "ADMIN") {
    return ADMIN_PERMISSIONS;
  }

  // Teachers get the default permissions (could be extended to read from JWT claims later)
  return DEFAULT_TEACHER_PERMISSIONS;
}
