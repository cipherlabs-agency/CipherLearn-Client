import type { AnnouncementCategory, AnnouncementPriority } from "../../../../prisma/generated/prisma/enums";

// ─── Attachment stored in Announcement.attachments JSON ─────────────────────
export interface AnnouncementAttachment {
  url: string;
  filename: string;
  size: number;       // bytes
  mimeType: string;
}

// ─── Metadata stored in Announcement.metadata JSON ──────────────────────────
// Key-value pairs for "Important Dates" section shown in detail view
export type AnnouncementMetadata = Record<string, string>;

// ─── List item (compact) ────────────────────────────────────────────────────
export interface AppAnnouncementListItem {
  id: number;
  title: string;
  description: string;       // short preview
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  department: string | null;
  date: string | null;
  hasAttachments: boolean;
  createdAt: string;
}

// ─── Detail (full) ──────────────────────────────────────────────────────────
export interface AppAnnouncementDetail extends AppAnnouncementListItem {
  body: string | null;                        // full rich-text content
  attachments: AnnouncementAttachment[];
  metadata: AnnouncementMetadata | null;       // "Important Dates" key-value
  imageUrl: string | null;
}

// ─── Query params for list endpoint ─────────────────────────────────────────
export interface GetAnnouncementsQuery {
  category?: AnnouncementCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Paginated list response ─────────────────────────────────────────────────
export interface AnnouncementListResponse {
  announcements: AppAnnouncementListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
