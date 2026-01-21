import { AnnouncementPriority } from "../../../../prisma/generated/prisma/client";

export interface AppAnnouncement {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: string | null;
  priority: AnnouncementPriority;
  createdAt: string;
}
