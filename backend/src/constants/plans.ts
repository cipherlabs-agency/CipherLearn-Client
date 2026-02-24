export interface PlanDefaults {
  maxStudents: number;
  maxBatches: number;
  maxTeachers: number;
  maxStorageMB: number;
  featureQRAttendance: boolean;
  featureAssignments: boolean;
  featureFees: boolean;
  featureStudyMaterials: boolean;
  featureAnnouncements: boolean;
  featureVideos: boolean;
}

export const PLAN_DEFAULTS: Record<string, PlanDefaults> = {
  FREE: {
    maxStudents: 50,
    maxBatches: 3,
    maxTeachers: 2,
    maxStorageMB: 500,
    featureQRAttendance: true,
    featureAssignments: false,
    featureFees: false,
    featureStudyMaterials: false,
    featureAnnouncements: true,
    featureVideos: false,
  },
  STARTER: {
    maxStudents: 200,
    maxBatches: 10,
    maxTeachers: 5,
    maxStorageMB: 2048,
    featureQRAttendance: true,
    featureAssignments: true,
    featureFees: true,
    featureStudyMaterials: true,
    featureAnnouncements: true,
    featureVideos: false,
  },
  PRO: {
    maxStudents: 1000,
    maxBatches: 50,
    maxTeachers: 20,
    maxStorageMB: 10240,
    featureQRAttendance: true,
    featureAssignments: true,
    featureFees: true,
    featureStudyMaterials: true,
    featureAnnouncements: true,
    featureVideos: true,
  },
  ENTERPRISE: {
    maxStudents: 999999,
    maxBatches: 999999,
    maxTeachers: 999999,
    maxStorageMB: 999999,
    featureQRAttendance: true,
    featureAssignments: true,
    featureFees: true,
    featureStudyMaterials: true,
    featureAnnouncements: true,
    featureVideos: true,
  },
};

export const MRR_BY_PLAN: Record<string, number> = {
  FREE: 0,
  STARTER: 999,
  PRO: 2999,
  ENTERPRISE: 9999,
};
