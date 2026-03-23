import Joi from "joi";

const updateStudentProfile = Joi.object({
  phone: Joi.string().trim().max(20).optional().allow("", null),
  address: Joi.string().trim().max(500).optional().allow("", null),
  parentName: Joi.string().trim().max(100).optional().allow("", null),
});

const updateTeacherProfile = Joi.object({
  phone: Joi.string().trim().max(20).optional().allow("", null),
  gender: Joi.string().trim().max(20).optional().allow("", null),
  qualification: Joi.string().trim().max(200).optional().allow("", null),
  university: Joi.string().trim().max(200).optional().allow("", null),
  experience: Joi.number().integer().min(0).max(60).optional().allow(null),
  workTimingFrom: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow("", null)
    .messages({ "string.pattern.base": "workTimingFrom must be in HH:MM format" }),
  workTimingTo: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .optional()
    .allow("", null)
    .messages({ "string.pattern.base": "workTimingTo must be in HH:MM format" }),
  primarySubjects: Joi.array().items(Joi.string().trim().max(100)).max(10).optional(),
  secondarySubjects: Joi.array().items(Joi.string().trim().max(100)).max(10).optional(),
  bio: Joi.string().trim().max(1000).optional().allow("", null),
});

export const ProfileValidations = { updateStudentProfile, updateTeacherProfile };
