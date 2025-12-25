import Joi from "joi";

const createNote = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 3 characters long",
    "string.max": "Title must not exceed 200 characters",
    "any.required": "Title is required",
  }),
  content: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": "Content must be an array of URLs",
    "string.uri": "Each content item must be a valid URL",
  }),
  batchId: Joi.number().integer().positive().required().messages({
    "number.base": "Batch ID must be a number",
    "number.integer": "Batch ID must be an integer",
    "number.positive": "Batch ID must be positive",
    "any.required": "Batch ID is required",
  }),
  category: Joi.string().max(50).optional().messages({
    "string.max": "Category must not exceed 50 characters",
  }),
});

const updateNote = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    "string.min": "Title must be at least 3 characters long",
    "string.max": "Title must not exceed 200 characters",
  }),
  content: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": "Content must be an array of URLs",
    "string.uri": "Each content item must be a valid URL",
  }),
  batchId: Joi.number().integer().positive().optional().messages({
    "number.base": "Batch ID must be a number",
    "number.integer": "Batch ID must be an integer",
    "number.positive": "Batch ID must be positive",
  }),
  category: Joi.string().max(50).optional().messages({
    "string.max": "Category must not exceed 50 characters",
  }),
});

const noteId = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Note ID must be a number",
    "number.integer": "Note ID must be an integer",
    "number.positive": "Note ID must be positive",
    "any.required": "Note ID is required",
  }),
});

const getNotes = Joi.object({
  batchId: Joi.number().integer().positive().optional().messages({
    "number.base": "Batch ID must be a number",
    "number.integer": "Batch ID must be an integer",
    "number.positive": "Batch ID must be positive",
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),
  category: Joi.string().max(50).optional().messages({
    "string.max": "Category must not exceed 50 characters",
  }),
});

const deleteNote = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Note ID must be a number",
    "number.integer": "Note ID must be an integer",
    "number.positive": "Note ID must be positive",
    "any.required": "Note ID is required",
  }),
  deletedBy: Joi.string().optional().default("system").messages({
    "string.base": "Deleted by must be a string",
  }),
});

export const NotesValidations = {
  createNote,
  updateNote,
  noteId,
  getNotes,
  deleteNote,
};
