import { Router } from "express";
import NotesController from "./controller";
import { notesUpload } from "../../../config/multer.config";
import { validateRequest, handleMulterError, logFileUpload } from "./middleware";
import { NotesValidations } from "./validation";

const router = Router();
const controller = new NotesController();

/**
 * @route   POST /notes
 * @desc    Create a new note with file uploads (images & documents)
 * @access  Private (should add authentication middleware)
 * @files   Max 5 files, 10MB each
 * @accepts images (JPG, PNG, GIF, WEBP), documents (PDF, DOC, DOCX, PPT, PPTX), text (TXT, MD)
 */
router.post(
  "/",
  notesUpload.array("files", 5),
  handleMulterError,
  logFileUpload,
  validateRequest(NotesValidations.createNote, "body"),
  controller.createNote.bind(controller)
);

/**
 * @route   GET /notes
 * @desc    Get all notes with pagination and filtering
 * @access  Private
 * @query   batchId, page, limit, category
 */
router.get(
  "/",
  validateRequest(NotesValidations.getNotes, "query"),
  controller.getNotes.bind(controller)
);

/**
 * @route   GET /notes/:id
 * @desc    Get a single note by ID
 * @access  Private
 */
router.get(
  "/:id",
  validateRequest(NotesValidations.noteId, "params"),
  controller.getNoteById.bind(controller)
);

/**
 * @route   PUT /notes/:id
 * @desc    Update a note with optional file uploads
 * @access  Private
 * @files   Max 5 files, 10MB each
 */
router.put(
  "/:id",
  notesUpload.array("files", 5),
  handleMulterError,
  logFileUpload,
  validateRequest(NotesValidations.noteId, "params"),
  validateRequest(NotesValidations.updateNote, "body"),
  controller.updateNote.bind(controller)
);

/**
 * @route   DELETE /notes/:id
 * @desc    Soft delete a note
 * @access  Private (Admin/Teacher only)
 */
router.delete(
  "/:id",
  validateRequest(NotesValidations.noteId, "params"),
  controller.deleteNote.bind(controller)
);

export default router;
