import Joi from "joi";

const createLecture = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "any.required": "Title is required",
  }),
  subject: Joi.string().trim().min(1).max(100).required().messages({
    "any.required": "Subject is required",
  }),
  batchId: Joi.number().integer().min(1).required().messages({
    "any.required": "Batch ID is required",
  }),
  date: Joi.string().isoDate().required().messages({
    "any.required": "Date is required",
    "string.isoDate": "Date must be a valid ISO date",
  }),
  startTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required()
    .messages({
      "any.required": "Start time is required",
      "string.pattern.base": "Start time must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required()
    .messages({
      "any.required": "End time is required",
      "string.pattern.base": "End time must be in HH:MM format",
    }),
  room: Joi.string().trim().max(100).optional().allow("", null),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  isOnline: Joi.boolean().default(false),
  meetingLink: Joi.string().uri().max(500).optional().allow("", null),
  notifyStudents: Joi.boolean().default(false),
  recurrenceId: Joi.string().optional().allow("", null),
});

const updateLecture = Joi.object({
  title: Joi.string().trim().min(2).max(200).optional(),
  subject: Joi.string().trim().min(1).max(100).optional(),
  date: Joi.string().isoDate().optional(),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  room: Joi.string().trim().max(100).optional().allow("", null),
  description: Joi.string().trim().max(2000).optional().allow("", null),
  isOnline: Joi.boolean().optional(),
  meetingLink: Joi.string().uri().max(500).optional().allow("", null),
  notifyStudents: Joi.boolean().optional(),
  status: Joi.string().valid("SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED").optional(),
});

const addNotes = Joi.object({
  notes: Joi.string().trim().min(1).max(5000).required().messages({
    "any.required": "Notes content is required",
  }),
});

const myScheduleQuery = Joi.object({
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  subject: Joi.string().trim().max(100).optional().allow(""),
});

export const LecturesValidations = { createLecture, updateLecture, addNotes, myScheduleQuery };
