import { Prisma } from "../../../../prisma/generated/prisma/client";

export type Note = Omit<
  Prisma.NoteCreateInput,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy" | "isDeleted"
>;

export interface FileMetadata {
  url: string;
  public_id: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string[]; // Array of URLs (images, documents)
  batchId: number;
  category?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string[]; // Array of URLs (images, documents)
  batchId?: number;
  category?: string;
}

export interface GetNotesQuery {
  batchId?: number;
  page?: number;
  limit?: number;
  category?: string;
}
