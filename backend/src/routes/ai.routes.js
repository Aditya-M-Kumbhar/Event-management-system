const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ai/ai.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { aiLimiter }             = require('../middleware/rateLimiter.middleware');

// Public AI routes (with optional auth)
router.post('/search',       aiLimiter, optionalAuth, ctrl.naturalLanguageSearch);
router.get('/suggestions',   aiLimiter, ctrl.searchSuggestions);
router.get('/similar/:eventId', ctrl.getSimilarEvents);

// Authenticated AI routes
router.use(protect);
router.post('/chat',         aiLimiter, ctrl.chat);
router.get('/recommendations', aiLimiter, ctrl.getRecommendations);

// Organiser-only AI tools
router.post('/description',  aiLimiter, ctrl.generateDescription);
router.post('/faqs',         aiLimiter, ctrl.generateFAQs);
router.post('/tagline',      aiLimiter, ctrl.generateTagline);
router.post('/schedule',     aiLimiter, ctrl.buildSchedule);
router.post('/schedule/review', aiLimiter, ctrl.reviewSchedule);

module.exports = router;
