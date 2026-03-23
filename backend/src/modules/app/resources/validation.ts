import Joi from "joi";

const createMaterial = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Title is required",
  }),
  batchId: Joi.number().integer().min(1).required().messages({
    "any.required": "Batch ID is required",
  }),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  subject: Joi.string().trim().max(100).optional().allow("", null),
  chapter: Joi.string().trim().max(100).optional().allow("", null),
  category: Joi.string().trim().max(100).optional().allow("", null),
  materialType: Joi.string()
    .valid("DOCUMENT", "VIDEO", "NOTES", "SLIDES", "WORKSHEET")
    .default("DOCUMENT"),
  materialStatus: Joi.string().valid("DRAFT", "PUBLISHED", "SCHEDULED").default("PUBLISHED"),
  scheduledAt: Joi.date().iso().optional().allow(null),
  visibleBatchIds: Joi.array().items(Joi.number().integer().min(1)).default([]),
  folderId: Joi.number().integer().min(1).optional().allow(null),
  notifyStudents: Joi.boolean().default(false),
});

const updateMaterial = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  subject: Joi.string().trim().max(100).optional().allow("", null),
  chapter: Joi.string().trim().max(100).optional().allow("", null),
  category: Joi.string().trim().max(100).optional().allow("", null),
  materialType: Joi.string()
    .valid("DOCUMENT", "VIDEO", "NOTES", "SLIDES", "WORKSHEET")
    .optional(),
  materialStatus: Joi.string().valid("DRAFT", "PUBLISHED", "SCHEDULED").optional(),
  scheduledAt: Joi.date().iso().optional().allow(null),
  visibleBatchIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
  folderId: Joi.number().integer().min(1).optional().allow(null),
});

const createVideo = Joi.object({
  url: Joi.string().uri().max(500).required().messages({
    "any.required": "YouTube URL is required",
    "string.uri": "Must be a valid URL",
  }),
  title: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Title is required",
  }),
  batchId: Joi.number().integer().min(1).required().messages({
    "any.required": "Batch ID is required",
  }),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  category: Joi.string().trim().max(100).optional().allow("", null),
  subject: Joi.string().trim().max(100).optional().allow("", null),
  publish: Joi.boolean().default(false),
  visibleBatchIds: Joi.array().items(Joi.number().integer().min(1)).default([]),
  scheduledAt: Joi.date().iso().optional().allow(null),
  notifyStudents: Joi.boolean().default(false),
});

const updateVideo = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  category: Joi.string().trim().max(100).optional().allow("", null),
  subject: Joi.string().trim().max(100).optional().allow("", null),
  visibility: Joi.string().valid("PUBLIC", "PRIVATE", "UNLISTED").optional(),
  visibleBatchIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
  scheduledAt: Joi.date().iso().optional().allow(null),
});

const createFolder = Joi.object({
  batchId: Joi.number().integer().min(1).required().messages({
    "any.required": "Batch ID is required",
  }),
  name: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Folder name is required",
    "string.max": "Folder name cannot exceed 100 characters",
  }),
});

const updateFolder = Joi.object({
  batchId: Joi.number().integer().min(1).required(),
  name: Joi.string().trim().min(1).max(100).required(),
});

const starResource = Joi.object({
  resourceType: Joi.string().valid("note", "study_material", "video").required().messages({
    "any.required": "Resource type is required",
    "any.only": "Resource type must be note, study_material, or video",
  }),
  resourceId: Joi.number().integer().min(1).required().messages({
    "any.required": "Resource ID is required",
  }),
});

const teacherListQuery = Joi.object({
  batchId: Joi.number().integer().min(1).optional(),
  tab: Joi.string().valid("published", "drafts", "scheduled").optional(),
  subject: Joi.string().trim().max(100).optional().allow(""),
  search: Joi.string().trim().max(200).optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const ResourcesValidations = {
  createMaterial,
  updateMaterial,
  createVideo,
  updateVideo,
  createFolder,
  updateFolder,
  starResource,
  teacherListQuery,
};
