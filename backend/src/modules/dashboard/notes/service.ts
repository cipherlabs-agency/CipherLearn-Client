import { prisma } from "../../../config/db.config";
import CloudinaryService from "../../../config/cloudinairy.config";
import { validateMagicNumber } from "../../../config/multer.config";
import { CreateNoteInput, UpdateNoteInput, GetNotesQuery } from "./types";
import { invalidateAfterResourceMutation } from "../../../cache/invalidation";
import { log } from "../../../utils/logtail";

const cloudinaryService = new CloudinaryService();

export default class NotesService {
  /**
   * Validate batch exists before creating/updating notes
   */
  private async validateBatchExists(batchId: number): Promise<void> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found`);
    }
  }

  /**
   * Validate file security (magic numbers)
   */
  private validateFilesSecurity(files: Express.Multer.File[]): void {
    for (const file of files) {
      const isValid = validateMagicNumber(file.buffer, file.mimetype);
      if (!isValid) {
        throw new Error(
          `File ${file.originalname} failed security validation. File content does not match declared type.`
        );
      }
    }
  }

  /**
   * Create a new note with file uploads
   */
  async createNote(
    data: CreateNoteInput,
    files?: Express.Multer.File[]
  ): Promise<any> {
    try {
      // Validate batch exists
      await this.validateBatchExists(data.batchId);

      const content: string[] = [...(data.content || [])];

      // Upload files to Cloudinary if provided
      if (files && files.length > 0) {
        // Validate file security (magic numbers)
        this.validateFilesSecurity(files);

        // Upload to Cloudinary with auto resource type detection
        const uploadedFiles = await cloudinaryService.uploadDocuments(
          files,
          `notes/${data.batchId}`
        );

        // Add file URLs to content array
        uploadedFiles.forEach((file) => {
          content.push(file.url);
        });

        console.log(
          `Uploaded ${uploadedFiles.length} files for note: ${data.title}`
        );
      }

      // Create note in database
      const note = await prisma.note.create({
        data: {
          title: data.title,
          content,
          batchId: data.batchId,
          category: data.category,
        },
      });

      invalidateAfterResourceMutation();
      return note;
    } catch (error: any) {
      log("error", "dashboard.notes.invalidateAfterResourceMutation failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("Error creating note:", error);

      // Provide specific error messages
      if (error.message.includes("Batch")) {
        throw new Error(error.message);
      }
      if (error.message.includes("security validation")) {
        throw new Error(error.message);
      }
      if (error.message.includes("Cloudinary")) {
        throw new Error("File upload failed. Please try again.");
      }

      throw new Error("Failed to create note");
    }
  }

  /**
   * Get all notes with pagination and filtering
   */
  async getNotes(query: GetNotesQuery): Promise<{
    notes: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { batchId, page = 1, limit = 10, category } = query;

    const where: any = { isDeleted: false };

    if (batchId) {
      where.batchId = batchId;
    }

    if (category) {
      where.category = category;
    }

    // Get total count for pagination
    const total = await prisma.note.count({ where });

    // Get paginated notes
    const notes = await prisma.note.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single note by ID
   */
  async getNoteById(id: number): Promise<any> {
    const note = await prisma.note.findUnique({
      where: { id, isDeleted: false },
    });

    if (!note) {
      throw new Error("Note not found");
    }

    return note;
  }

  /**
   * Update a note with optional file uploads
   */
  async updateNote(
    id: number,
    data: UpdateNoteInput,
    files?: Express.Multer.File[]
  ): Promise<any> {
    try {
      // Check if note exists
      const existingNote = await this.getNoteById(id);

      // Validate batch if it's being updated
      if (data.batchId && data.batchId !== existingNote.batchId) {
        await this.validateBatchExists(data.batchId);
      }

      const content: string[] = data.content
        ? [...data.content]
        : [...existingNote.content];

      // Upload new files if provided
      if (files && files.length > 0) {
        // Validate file security
        this.validateFilesSecurity(files);

        const batchId = data.batchId || existingNote.batchId;
        const uploadedFiles = await cloudinaryService.uploadDocuments(
          files,
          `notes/${batchId}`
        );

        // Add new file URLs to content array
        uploadedFiles.forEach((file) => {
          content.push(file.url);
        });

        console.log(
          `Uploaded ${uploadedFiles.length} new files for note ID: ${id}`
        );
      }

      // Update note in database
      const updatedNote = await prisma.note.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.batchId && { batchId: data.batchId }),
          ...(data.category && { category: data.category }),
          content,
        },
      });

      invalidateAfterResourceMutation();
      return updatedNote;
    } catch (error: any) {
      log("error", "dashboard.notes.invalidateAfterResourceMutation failed", { err: error instanceof Error ? error.message : String(error) });
      console.error("Error updating note:", error);

      if (error.message.includes("not found")) {
        throw new Error("Note not found");
      }
      if (error.message.includes("Batch")) {
        throw new Error(error.message);
      }
      if (error.message.includes("security validation")) {
        throw new Error(error.message);
      }

      throw new Error("Failed to update note");
    }
  }

  /**
   * Soft delete a note
   */
  async deleteNote(id: number, deletedBy: string): Promise<void> {
    // Check if note exists
    await this.getNoteById(id);

    await prisma.note.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedBy,
        deletedAt: new Date(),
      },
    });

    invalidateAfterResourceMutation();
    console.log(`Note ID ${id} soft deleted by ${deletedBy}`);
  }
}
