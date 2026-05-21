const ApiResponse = require('../utils/apiResponse');

/**
 * Validate request body using a Joi schema
 */
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, ''));
    return ApiResponse.error(res, messages.join('. '), 400, messages);
  }
  next();
};

module.exports = { validateRequest };
