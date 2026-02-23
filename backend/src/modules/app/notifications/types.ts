// ─── Notification preference categories ──────────────────────────────────────

export interface AcademicAlerts {
  classStartingSoon: boolean;    // Alert 10 mins before class starts
  timetableChanges: boolean;     // Immediate schedule updates
}

export interface ExamsResults {
  newTestScheduled: boolean;
  resultPublished: boolean;
}

export interface MaterialsUpdates {
  newStudyMaterial: boolean;
  classResourceUploaded: boolean;
}

export interface Administrative {
  schoolAnnouncements: boolean;
  doubtResponses: boolean;
}

export interface QuietHours {
  enabled: boolean;
  from: string; // HH:MM (24-hour)
  to: string;   // HH:MM (24-hour)
}

// ─── Full preferences object (GET + PUT) ─────────────────────────────────────

export interface NotificationPreferences {
  academicAlerts: AcademicAlerts;
  examsResults: ExamsResults;
  materialsUpdates: MaterialsUpdates;
  administrative: Administrative;
  quietHours: QuietHours;
}

// ─── PUT request body ────────────────────────────────────────────────────────

export type UpdateNotificationPreferencesInput = Partial<{
  academicAlerts: Partial<AcademicAlerts>;
  examsResults: Partial<ExamsResults>;
  materialsUpdates: Partial<MaterialsUpdates>;
  administrative: Partial<Administrative>;
  quietHours: Partial<QuietHours>;
}>;
