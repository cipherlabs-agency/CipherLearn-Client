import Joi from "joi";

const bulkSaveScores = Joi.object({
  scores: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.number().integer().min(1).required(),
        marksObtained: Joi.number().min(0).required(),
        remarks: Joi.string().trim().max(500).optional().allow("", null),
      })
    )
    .min(1)
    .required()
    .messages({
      "any.required": "Scores array is required",
      "array.min": "At least one score entry is required",
    }),
});

const teacherTestsQuery = Joi.object({
  batchId: Joi.number().integer().min(1).optional(),
  subject: Joi.string().trim().max(100).optional().allow(""),
  status: Joi.string()
    .valid("DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "PUBLISHED")
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const studentTestsQuery = Joi.object({
  filter: Joi.string().valid("upcoming", "complete", "results", "all").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const TestsValidations = { bulkSaveScores, teacherTestsQuery, studentTestsQuery };
