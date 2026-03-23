import Joi from "joi";

const createAssignment = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Title is required",
  }),
  subject: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Subject is required",
  }),
  description: Joi.string().trim().max(3000).optional().allow("", null),
  // batchIds comes as JSON string in multipart form
  batchIds: Joi.alternatives()
    .try(
      Joi.array().items(Joi.number().integer().min(1)).min(1),
      Joi.string() // JSON string from multipart — controller parses it
    )
    .required()
    .messages({ "any.required": "At least one batch ID is required" }),
  dueDate: Joi.string().isoDate().optional().allow("", null),
  submissionType: Joi.string().valid("FILE_UPLOAD", "TEXT_ENTRY", "BOTH").default("FILE_UPLOAD"),
  assignmentStatus: Joi.string().valid("DRAFT", "PUBLISHED").default("PUBLISHED"),
  allowLateSubmissions: Joi.boolean().default(false),
  plagiarismCheck: Joi.boolean().default(false),
});

const updateAssignment = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  subject: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(3000).optional().allow("", null),
  dueDate: Joi.string().isoDate().optional().allow("", null),
  submissionType: Joi.string().valid("FILE_UPLOAD", "TEXT_ENTRY", "BOTH").optional(),
  assignmentStatus: Joi.string().valid("DRAFT", "PUBLISHED").optional(),
  allowLateSubmissions: Joi.boolean().optional(),
  plagiarismCheck: Joi.boolean().optional(),
});

const reviewSubmission = Joi.object({
  status: Joi.string().valid("ACCEPTED", "REJECTED").required().messages({
    "any.required": "Review status is required",
    "any.only": "Status must be ACCEPTED or REJECTED",
  }),
  feedback: Joi.string().trim().max(2000).optional().allow("", null),
});

const submitAssignment = Joi.object({
  note: Joi.string().trim().max(1000).optional().allow("", null),
});

const listQuery = Joi.object({
  batchId: Joi.number().integer().min(1).optional(),
  tab: Joi.string().valid("active", "drafts", "graded").optional(),
  status: Joi.string().valid("pending", "completed").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  includeExpired: Joi.boolean().optional(),
});

export const AssignmentsValidations = {
  createAssignment,
  updateAssignment,
  reviewSubmission,
  submitAssignment,
  listQuery,
};
