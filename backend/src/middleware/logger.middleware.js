const morgan  = require('morgan');
const logger  = require('../utils/logger');

const stream = { write: (message) => logger.info(message.trim()) };

const devLogger  = morgan('dev');
const prodLogger = morgan('combined', { stream });

module.exports = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
