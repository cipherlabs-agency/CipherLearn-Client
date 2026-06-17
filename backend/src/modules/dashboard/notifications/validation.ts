import Joi from "joi";

const getNotificationsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(30),
  unreadOnly: Joi.boolean().default(false),
});

const markAsReadParams = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const NotificationValidations = {
  getNotificationsQuery,
  markAsReadParams,
};
