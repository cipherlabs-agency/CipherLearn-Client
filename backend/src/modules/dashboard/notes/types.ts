import { Prisma } from "../../../../prisma/generated/prisma/client";

export type Note = Omit<
  Prisma.NoteCreateInput,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy" | "isDeleted"
>;
