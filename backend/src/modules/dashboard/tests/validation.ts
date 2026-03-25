import joi from "joi";

const create = joi.object({
  title: joi.string().min(2).max(200).required(),
  subject: joi.string().min(1).max(100).required(),
  description: joi.string().max(1000).optional().allow("", null),
  testType: joi.string().valid("UNIT_TEST", "MIDTERM", "FINAL", "QUIZ", "PRACTICE").optional().default("UNIT_TEST"),
  batchId: joi.number().integer().positive().required(),
  totalMarks: joi.number().positive().required(),
  passingMarks: joi.number().min(0).optional().allow(null),
  date: joi.string().isoDate().required(),
  time: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().allow("", null)
    .messages({ "string.pattern.base": "time must be in HH:mm format" }),
  duration: joi.number().integer().positive().optional().allow(null),
  hall: joi.string().max(100).optional().allow("", null),
  syllabus: joi.string().max(5000).optional().allow("", null),
  instructions: joi.string().max(5000).optional().allow("", null),
});

const update = joi.object({
  title: joi.string().min(2).max(200).optional(),
  subject: joi.string().min(1).max(100).optional(),
  description: joi.string().max(1000).optional().allow("", null),
  testType: joi.string().valid("UNIT_TEST", "MIDTERM", "FINAL", "QUIZ", "PRACTICE").optional(),
  batchId: joi.number().integer().positive().optional(),
  totalMarks: joi.number().positive().optional(),
  passingMarks: joi.number().min(0).optional().allow(null),
  date: joi.string().isoDate().optional(),
  time: joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().allow("", null),
  duration: joi.number().integer().positive().optional().allow(null),
  hall: joi.string().max(100).optional().allow("", null),
  syllabus: joi.string().max(5000).optional().allow("", null),
  instructions: joi.string().max(5000).optional().allow("", null),
  status: joi.string().valid("DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "PUBLISHED").optional(),
});

const uploadScore = joi.object({
  studentId: joi.number().integer().positive().required(),
  marksObtained: joi.number().min(0).required(),
  remarks: joi.string().max(500).optional().allow("", null),
});

const updateScore = joi.object({
  marksObtained: joi.number().min(0).optional(),
  remarks: joi.string().max(500).optional().allow("", null),
  status: joi.string().valid("PASS", "FAIL", "ABSENT").optional(),
});

const list = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  batchId: joi.number().integer().positive().optional(),
  subject: joi.string().max(100).optional(),
  status: joi.string().valid("DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "PUBLISHED").optional(),
  testType: joi.string().valid("UNIT_TEST", "MIDTERM", "FINAL", "QUIZ", "PRACTICE").optional(),
});

const scoresQuery = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(50),
});

export const TestValidations = {
  create,
  update,
  uploadScore,
  updateScore,
  list,
  scoresQuery,
};
