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

const TEST_TYPES = ["UNIT_TEST", "MIDTERM", "FINAL", "QUIZ", "PRACTICE"];
const TEST_STATUSES = ["DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "PUBLISHED"];

const createTest = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  subject: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(1000).optional().allow("", null),
  testType: Joi.string().valid(...TEST_TYPES).default("UNIT_TEST"),
  batchId: Joi.number().integer().min(1).required(),
  totalMarks: Joi.number().min(1).required(),
  passingMarks: Joi.number().min(0).max(Joi.ref("totalMarks")).optional().allow(null),
  date: Joi.string().isoDate().required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional().allow("", null),
  duration: Joi.number().integer().min(1).optional().allow(null),
  hall: Joi.string().trim().max(100).optional().allow("", null),
  syllabus: Joi.string().trim().max(2000).optional().allow("", null),
  instructions: Joi.string().trim().max(2000).optional().allow("", null),
});

const updateTest = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  subject: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(1000).optional().allow("", null),
  testType: Joi.string().valid(...TEST_TYPES).optional(),
  batchId: Joi.number().integer().min(1).optional(),
  totalMarks: Joi.number().min(1).optional(),
  passingMarks: Joi.number().min(0).optional().allow(null),
  date: Joi.string().isoDate().optional(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional().allow("", null),
  duration: Joi.number().integer().min(1).optional().allow(null),
  hall: Joi.string().trim().max(100).optional().allow("", null),
  syllabus: Joi.string().trim().max(2000).optional().allow("", null),
  instructions: Joi.string().trim().max(2000).optional().allow("", null),
  status: Joi.string().valid(...TEST_STATUSES).optional(),
});

export const TestsValidations = { bulkSaveScores, teacherTestsQuery, studentTestsQuery, createTest, updateTest };
