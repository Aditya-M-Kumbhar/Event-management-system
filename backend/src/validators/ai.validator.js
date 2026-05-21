const Joi = require('joi');

// Prevent prompt injection and over-large inputs
exports.descriptionSchema = Joi.object({
  topic:        Joi.string().min(3).max(200).required(),
  bulletPoints: Joi.string().min(5).max(2000).required(),
  audience:     Joi.string().max(200),
  tone:         Joi.string().max(100),
  category:     Joi.string().max(50),
});

exports.searchSchema = Joi.object({
  query: Joi.string().min(2).max(300).required(),
});

exports.scheduleSchema = Joi.object({
  sessions:      Joi.array().items(Joi.object({
    title:    Joi.string().max(200).required(),
    duration: Joi.number().integer().min(5).max(480).required(),
    speaker:  Joi.string().max(100),
    type:     Joi.string().valid('session','break','keynote','workshop','panel','networking'),
    tags:     Joi.array().items(Joi.string()),
  })).min(1).max(50).required(),
  startTime:     Joi.string().pattern(/^\d{2}:\d{2}$/),
  endTime:       Joi.string().pattern(/^\d{2}:\d{2}$/),
  breakInterval: Joi.number().integer().min(30).max(180),
  eventType:     Joi.string().max(50),
  theme:         Joi.string().max(200),
});

exports.chatSchema = Joi.object({
  message:             Joi.string().min(1).max(500).required(),
  conversationHistory: Joi.array().max(20),
  eventId:             Joi.string().hex().length(24),
});
