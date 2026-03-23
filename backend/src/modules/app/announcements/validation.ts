import Joi from "joi";

const listQuery = Joi.object({
  category: Joi.string()
    .valid("GENERAL", "EXAM", "HOLIDAY", "LECTURE", "EVENT")
    .optional(),
  search: Joi.string().trim().max(200).optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const createAnnouncement = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({
    "any.required": "Title is required",
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 200 characters",
  }),
  description: Joi.string().trim().min(5).max(500).required().messages({
    "any.required": "Description is required",
  }),
  body: Joi.string().trim().max(10000).optional().allow("", null),
  category: Joi.string()
    .valid("GENERAL", "EXAM", "HOLIDAY", "LECTURE", "EVENT")
    .default("GENERAL"),
  priority: Joi.string().valid("LOW", "NORMAL", "HIGH", "URGENT").default("NORMAL"),
  department: Joi.string().trim().max(100).optional().allow("", null),
  isDraft: Joi.boolean().default(false),
  scheduledAt: Joi.date().iso().optional().allow(null),
  targetBatchIds: Joi.array().items(Joi.number().integer().min(1)).default([]),
  pinned: Joi.boolean().default(false),
});

const updateAnnouncement = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().min(5).max(500).optional(),
  body: Joi.string().trim().max(10000).optional().allow("", null),
  category: Joi.string()
    .valid("GENERAL", "EXAM", "HOLIDAY", "LECTURE", "EVENT")
    .optional(),
  priority: Joi.string().valid("LOW", "NORMAL", "HIGH", "URGENT").optional(),
  department: Joi.string().trim().max(100).optional().allow("", null),
  isDraft: Joi.boolean().optional(),
  scheduledAt: Joi.date().iso().optional().allow(null),
  targetBatchIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
  pinned: Joi.boolean().optional(),
});

export const AnnouncementsValidations = { listQuery, createAnnouncement, updateAnnouncement };
