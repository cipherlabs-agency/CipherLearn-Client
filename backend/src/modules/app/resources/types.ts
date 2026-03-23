export interface AppResourceFile {
  url: string;
  publicId: string;
  filename: string;
  size?: number;
}

export interface AppVideo {
  id: number;
  title: string;
  description: string | null;
  url: string;
  category: string | null;
  subject?: string | null;
  createdAt: string;
}

export interface AppNote {
  id: number;
  title: string;
  content: string[];
  category: string | null;
  createdAt: string;
}

export interface AppStudyMaterial {
  id: number;
  title: string;
  description: string | null;
  files: AppResourceFile[];
  category: string | null;
  createdAt: string;
}

export interface AppResourceQuery {
  search?: string;
  category?: string;
}

// ─── Teacher-side Types ───────────────────────────────────────────────────────

export interface TeacherMaterialListItem {
  id: number;
  title: string;
  description: string | null;
  subject: string | null;
  chapter: string | null;
  materialType: string;
  materialStatus: string;
  scheduledAt: string | null;
  files: AppResourceFile[];
  batchId: number;
  batchName: string;
  visibleBatchIds: number[];
  folderId?: number | null;
  createdAt: string;
}

export interface CreateMaterialInput {
  title: string;
  description?: string;
  subject?: string;
  chapter?: string;
  materialType?: string;
  materialStatus?: string;
  scheduledAt?: string;
  batchId: number;
  visibleBatchIds?: number[];
  folderId?: number;
}

export interface UpdateMaterialInput {
  title?: string;
  description?: string;
  subject?: string;
  chapter?: string;
  materialType?: string;
  materialStatus?: string;
  scheduledAt?: string | null;
  visibleBatchIds?: number[];
  folderId?: number | null;
}

export interface GetTeacherMaterialsQuery {
  tab?: "published" | "drafts" | "scheduled";
  subject?: string;
  batchId?: number;
  page?: number;
  limit?: number;
}

// ─── Starred Resources ────────────────────────────────────────────────────────

export type StarResourceType = "note" | "study_material" | "video";

export interface StarredResourcesResponse {
  notes: AppNote[];
  studyMaterials: AppStudyMaterial[];
  videos: AppVideo[];
}
