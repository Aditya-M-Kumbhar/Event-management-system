const Joi = require('joi');

exports.createOrderSchema = Joi.object({
  eventId:    Joi.string().hex().length(24).required(),
  couponCode: Joi.string().uppercase().max(20),
  items: Joi.array().items(
    Joi.object({
      ticketTypeId: Joi.string().hex().length(24).required(),
      quantity:     Joi.number().integer().min(1).max(20).required(),
    })
  ).min(1).required(),
});

exports.refundSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required(),
});
