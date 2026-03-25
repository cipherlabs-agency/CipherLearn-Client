import Joi from "joi";

const create = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    "any.required": "Title is required",
    "string.empty": "Title cannot be empty",
    "string.max": "Title cannot exceed 200 characters",
  }),
  description: Joi.string().required().messages({
    "any.required": "Description is required",
    "string.empty": "Description cannot be empty",
  }),
  imageUrl: Joi.string().uri().allow(null, "").optional(),
  date: Joi.string().allow(null, "").optional(),
  priority: Joi.string()
    .valid("LOW", "NORMAL", "HIGH", "URGENT")
    .optional()
    .messages({ "any.only": "Priority must be LOW, NORMAL, HIGH, or URGENT" }),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  priority: Joi.string().valid("LOW", "NORMAL", "HIGH", "URGENT").optional(),
  isActive: Joi.boolean().optional(),
});

export const AnnouncementValidations = { create, listQuery };
