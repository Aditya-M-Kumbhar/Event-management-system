const Joi = require('joi');

exports.createReviewSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required(),
  rating:  Joi.number().integer().min(1).max(5).required(),
  title:   Joi.string().max(100),
  body:    Joi.string().max(1000),
});
