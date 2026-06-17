import Joi from "joi";

const dmButton = Joi.object({
  title: Joi.string().trim().max(80).required(),
  url: Joi.string().uri().required(),
});

const createRule = Joi.object({
  mediaId: Joi.string().trim().max(100).required().messages({
    "any.required": "Media ID is required",
  }),
  mediaUrl: Joi.string().uri().optional().allow("", null),
  mediaCaption: Joi.string().trim().max(2200).optional().allow("", null),
  mediaType: Joi.string().valid("IMAGE", "VIDEO", "CAROUSEL_ALBUM").optional().allow("", null),
  triggerKeyword: Joi.string().trim().min(1).max(50).required().messages({
    "any.required": "Trigger keyword is required",
    "string.min": "Keyword must be at least 1 character",
  }),
  dmMessage: Joi.string().trim().min(1).max(1000).required().messages({
    "any.required": "DM message is required",
  }),
  dmType: Joi.string().valid("TEXT", "TEMPLATE").default("TEXT"),
  dmButtons: Joi.array().items(dmButton).max(3).optional(),
  isFollowGated: Joi.boolean().default(false),
  unfollowedMessage: Joi.string().trim().max(500).optional().allow("", null),
});

const updateRule = Joi.object({
  triggerKeyword: Joi.string().trim().min(1).max(50).optional(),
  dmMessage: Joi.string().trim().min(1).max(1000).optional(),
  dmType: Joi.string().valid("TEXT", "TEMPLATE").optional(),
  dmButtons: Joi.array().items(dmButton).max(3).optional(),
  status: Joi.string().valid("ACTIVE", "PAUSED").optional(),
  isFollowGated: Joi.boolean().optional(),
  unfollowedMessage: Joi.string().trim().max(500).optional().allow("", null),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});

const webhookTestBody = Joi.object({
  mediaId: Joi.string().trim().required(),
  commentText: Joi.string().trim().min(1).max(500).required(),
  commenterId: Joi.string().trim().required(),
});

const getLogsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(30),
  status: Joi.string().valid("SENT", "FAILED", "RATE_LIMITED", "SKIPPED").optional(),
});

const ruleLogsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const ruleIdParam = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const InstagramValidations = {
  createRule,
  updateRule,
  webhookTestBody,
  getLogsQuery,
  ruleLogsQuery,
  ruleIdParam,
};
