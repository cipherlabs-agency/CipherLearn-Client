import Joi from "joi";

const registerDevice = Joi.object({
  token: Joi.string().trim().min(10).max(500).required().messages({
    "any.required": "Device token is required",
  }),
  platform: Joi.string().valid("EXPO", "IOS", "ANDROID").default("EXPO"),
});

const deregisterDevice = Joi.object({
  token: Joi.string().trim().min(10).max(500).required().messages({
    "any.required": "Device token is required",
  }),
});

const updatePreferences = Joi.object({
  academicAlerts: Joi.object({
    classStartingSoon: Joi.boolean().optional(),
    timetableChanges: Joi.boolean().optional(),
  }).optional(),
  examsResults: Joi.object({
    newTestScheduled: Joi.boolean().optional(),
    resultPublished: Joi.boolean().optional(),
  }).optional(),
  materialsUpdates: Joi.object({
    newStudyMaterial: Joi.boolean().optional(),
    classResourceUploaded: Joi.boolean().optional(),
  }).optional(),
  administrative: Joi.object({
    schoolAnnouncements: Joi.boolean().optional(),
    doubtResponses: Joi.boolean().optional(),
  }).optional(),
  quietHours: Joi.object({
    enabled: Joi.boolean().optional(),
    from: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .optional()
      .messages({ "string.pattern.base": "Time must be in HH:MM format" }),
    to: Joi.string()
      .pattern(/^\d{2}:\d{2}$/)
      .optional()
      .messages({ "string.pattern.base": "Time must be in HH:MM format" }),
  }).optional(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  unreadOnly: Joi.boolean().optional(),
});

export const NotificationsValidations = {
  registerDevice,
  deregisterDevice,
  updatePreferences,
  listQuery,
};
