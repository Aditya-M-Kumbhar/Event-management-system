/**
 * EventSphere — Express Application Setup
 * Configures all middleware, routes, and error handling with full production CORS clearance
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport');

const { errorHandler } = require('./middleware/errorHandler.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const logger = require('./utils/logger');
const routes = require('./routes/index');

// Initialize Passport strategies
require('./config/passport');

const app = express();

// ─── 1. TRUST PROXY FOR CLOUD DEPLOYMENTS ────────────────────────────────────
// Tells Express it's behind Render's load balancers so secure cookies work properly
app.set("trust proxy", 1);

// ─── 2. PRODUCTION OPTIMIZED HELMET SECURITY ─────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },      // Allows Google OAuth popups/redirects to finish cleanly
  crossOriginEmbedderPolicy: false                         // Stops strict browser isolation from blocking Vercel preflights
}));

app.use(mongoSanitize());        // Prevent NoSQL injection

// ─── 3. BULLETPROOF CROSS-ORIGIN RESOURCE SHARING (CORS) ─────────────────────
const allowedOrigins = [
  'https://event-management-system-olive-seven.vercel.app',
  process.env.CLIENT_URL,
  'http://localhost:3000'
].filter(Boolean); // Safely filters out undefined values if CLIENT_URL isn't set

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or mobile requests with no origin header
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      logger.error(`[CORS Blocked] Request coming from unauthorized origin: ${origin}`);
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Globally intercepts and clears all preflight OPTIONS requests before hitting routes
app.options('*', cors());

// ─── 4. STANDARD INBOUND BODY PARSING ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── 5. REQUEST LOGGING STREAM ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
} else {
  app.use(morgan('dev'));
}

// ─── 6. PASSPORT IDENTITY INITIALIZATION ─────────────────────────────────────
app.use(passport.initialize());

// ─── 7. GLOBAL API RATE LIMITER ──────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── 8. CLOUD INFRASTRUCTURE HEALTH CHECK ────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

// ─── 9. MAIN ROUTE CONTROLLERS HANDLER ────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 10. 404 CATCH-ALL ROUTE HANDLER ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on server`,
  });
});

// ─── 11. CENTRALIZED SYSTEM ERROR HANDLER ────────────────────────────────────
app.use(errorHandler);

module.exports = app;