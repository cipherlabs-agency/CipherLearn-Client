import Joi from "joi";

const teacherPermissionsSchema = Joi.object({
  canManageLectures: Joi.boolean(),
  canUploadNotes: Joi.boolean(),
  canUploadVideos: Joi.boolean(),
  canManageAssignments: Joi.boolean(),
  canViewFees: Joi.boolean(),
  canManageStudyMaterials: Joi.boolean(),
  canSendAnnouncements: Joi.boolean(),
  canViewAnalytics: Joi.boolean(),
  canExportData: Joi.boolean(),
});

export const updateSettingsSchema = Joi.object({
  className: Joi.string().max(100).trim(),
  classEmail: Joi.string().email().allow("").max(150),
  classPhone: Joi.string().allow("").max(20),
  classAddress: Joi.string().allow("").max(300),
  classWebsite: Joi.string().uri().allow("").max(200),
  teacherPermissions: teacherPermissionsSchema,
}).min(1);
