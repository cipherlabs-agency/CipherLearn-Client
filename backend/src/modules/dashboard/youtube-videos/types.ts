import { Prisma } from "../../../../prisma/generated/prisma/client";
import { YoutubeVideoVisibility } from "../../../../prisma/generated/prisma/enums";

export type YoutubeVideo = Omit<
  Prisma.YoutubeVideoCreateInput,
  "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedBy"
>;

export interface UpdateYoutubeVideoInput {
  title?: string;
  description?: string;
  url?: string;
  visibility?: YoutubeVideoVisibility;
  category?: string;
  batchId?: number;
}

export interface GetYoutubeVideosQuery {
  batchId?: number;
  category?: string;
  visibility?: YoutubeVideoVisibility;
  page?: number;
  limit?: number;
  search?: string;
}
