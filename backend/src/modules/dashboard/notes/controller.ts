import { Request, Response } from "express";
import NotesService from "./service";
import { GetNotesQuery } from "./types";

const notesService = new NotesService();

export default class NotesController {
  /**
   * Create a new note with file uploads
   * POST /notes
   */
  async createNote(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const files = req.files as Express.Multer.File[];

      // Validate required fields
      if (!data.title || !data.batchId) {
        res.status(400).json({
          success: false,
          message: "Title and batchId are required",
        });
        return;
      }

      const note = await notesService.createNote(data, files);

      res.status(201).json({
        success: true,
        message: "Note created successfully",
        data: note,
      });
    } catch (error: any) {
      console.error("Controller error - createNote:", error);

      // Handle specific errors
      if (error.message.includes("Batch") && error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("security validation")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("File upload failed")) {
        res.status(500).json({
          success: false,
          message: "File upload failed. Please try again.",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to create note",
      });
    }
  }

  /**
   * Get all notes with pagination and filtering
   * GET /notes?batchId=1&page=1&limit=10&category=lecture
   */
  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const query: GetNotesQuery = {
        batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        category: req.query.category as string | undefined,
      };

      const result = await notesService.getNotes(query);

      res.status(200).json({
        success: true,
        data: result.notes,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("Controller error - getNotes:", error);

      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch notes",
      });
    }
  }

  /**
   * Get a single note by ID
   * GET /notes/:id
   */
  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          message: "Invalid note ID",
        });
        return;
      }

      const note = await notesService.getNoteById(Number(id));

      res.status(200).json({
        success: true,
        data: note,
      });
    } catch (error: any) {
      console.error("Controller error - getNoteById:", error);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: "Note not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch note",
      });
    }
  }

  /**
   * Update a note with optional file uploads
   * PUT /notes/:id
   */
  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;
      const files = req.files as Express.Multer.File[];

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          message: "Invalid note ID",
        });
        return;
      }

      const note = await notesService.updateNote(Number(id), data, files);

      res.status(200).json({
        success: true,
        message: "Note updated successfully",
        data: note,
      });
    } catch (error: any) {
      console.error("Controller error - updateNote:", error);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: "Note not found",
        });
        return;
      }

      if (error.message.includes("Batch") && error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("security validation")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to update note",
      });
    }
  }

  /**
   * Soft delete a note
   * DELETE /notes/:id
   */
  async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.body.deletedBy || "system";

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          success: false,
          message: "Invalid note ID",
        });
        return;
      }

      await notesService.deleteNote(Number(id), deletedBy);

      res.status(200).json({
        success: true,
        message: "Note deleted successfully",
      });
    } catch (error: any) {
      console.error("Controller error - deleteNote:", error);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: "Note not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete note",
      });
    }
  }
}
