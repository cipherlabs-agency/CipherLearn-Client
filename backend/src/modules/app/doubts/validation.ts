import Joi from "joi";

const postDoubt = Joi.object({
  title: Joi.string().trim().min(5).max(200).required().messages({
    "string.min": "Title must be at least 5 characters",
    "string.max": "Title cannot exceed 200 characters",
    "any.required": "Title is required",
  }),
  description: Joi.string().trim().min(10).max(2000).required().messages({
    "string.min": "Description must be at least 10 characters",
    "string.max": "Description cannot exceed 2000 characters",
    "any.required": "Description is required",
  }),
  subject: Joi.string().trim().max(100).optional().allow("", null),
});

const replyToDoubt = Joi.object({
  body: Joi.string().trim().min(2).max(2000).required().messages({
    "string.min": "Reply must be at least 2 characters",
    "string.max": "Reply cannot exceed 2000 characters",
    "any.required": "Reply body is required",
  }),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid("OPEN", "ANSWERED", "RESOLVED").optional(),
  batchId: Joi.number().integer().min(1).optional(),
});

export const DoubtsValidations = { postDoubt, replyToDoubt, listQuery };
