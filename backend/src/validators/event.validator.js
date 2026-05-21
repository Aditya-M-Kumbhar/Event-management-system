const Joi = require('joi');

exports.createEventSchema = Joi.object({
  title:         Joi.string().min(3).max(120).required(),
  description:   Joi.string().min(10).max(5000).required(),
  category:      Joi.string().valid(
    'Technology','Business','Music','Arts & Culture','Sports & Fitness',
    'Health & Wellness','Food & Drink','Education','Networking','Gaming',
    'Film & Media','Fashion','Travel','Social','Other'
  ).required(),
  startDate:     Joi.date().greater('now').required(),
  endDate:       Joi.date().greater(Joi.ref('startDate')).required(),
  format:        Joi.string().valid('online','offline','hybrid').required(),
  totalCapacity: Joi.number().integer().min(1).required(),
  'venue.city':  Joi.string().when('format', { is: 'offline', then: Joi.required() }),
  tags:          Joi.array().items(Joi.string().max(30)).max(10),
  isFree:        Joi.boolean(),
  status:        Joi.string().valid('draft','published'),
});

exports.updateEventSchema = Joi.object({
  title:         Joi.string().min(3).max(120),
  description:   Joi.string().min(10).max(5000),
  category:      Joi.string(),
  startDate:     Joi.date(),
  endDate:       Joi.date(),
  format:        Joi.string().valid('online','offline','hybrid'),
  totalCapacity: Joi.number().integer().min(1),
  tags:          Joi.array().items(Joi.string()),
  status:        Joi.string().valid('draft','published','cancelled'),
}).min(1);
