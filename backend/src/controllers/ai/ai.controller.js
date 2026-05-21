/**
 * AI Controllers — All Groq-powered AI features
 */

const asyncHandler    = require('../../utils/asyncHandler');
const ApiResponse     = require('../../utils/apiResponse');
const descService     = require('../../services/ai/eventDescription.service');
const searchService   = require('../../services/ai/search.service');
const schedulerService= require('../../services/ai/scheduler.service');
const chatbotService  = require('../../services/ai/chatbot.service');
const recommendService= require('../../services/ai/recommendation.service');

// ─── Generate Event Description ───────────────────────────────────────────────
exports.generateDescription = asyncHandler(async (req, res) => {
  const { topic, bulletPoints, audience, tone, category } = req.body;
  if (!topic || !bulletPoints) {
    return ApiResponse.error(res, 'topic and bulletPoints are required', 400);
  }

  const description = await descService.generateEventDescription({
    topic, bulletPoints, audience, tone, category,
  });

  return ApiResponse.success(res, { description }, 'Description generated');
});

// ─── Generate FAQs ────────────────────────────────────────────────────────────
exports.generateFAQs = asyncHandler(async (req, res) => {
  const { title, description, format, category } = req.body;
  if (!title) return ApiResponse.error(res, 'Event title is required', 400);

  const faqs = await descService.generateFAQs({ title, description, format, category });
  return ApiResponse.success(res, { faqs }, 'FAQs generated');
});

// ─── Generate Tagline ─────────────────────────────────────────────────────────
exports.generateTagline = asyncHandler(async (req, res) => {
  const { title, category, audience } = req.body;
  const tagline = await descService.generateTagline({ title, category, audience });
  return ApiResponse.success(res, { tagline }, 'Tagline generated');
});

// ─── Natural Language Search ──────────────────────────────────────────────────
exports.naturalLanguageSearch = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) return ApiResponse.error(res, 'Query is required', 400);

  const result = await searchService.parseNaturalLanguageSearch(query);
  return ApiResponse.success(res, result, 'Query parsed successfully');
});

// ─── Search Suggestions ───────────────────────────────────────────────────────
exports.searchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const suggestions = await searchService.generateSearchSuggestions(q);
  return ApiResponse.success(res, { suggestions });
});

// ─── Build Smart Schedule ─────────────────────────────────────────────────────
exports.buildSchedule = asyncHandler(async (req, res) => {
  const { sessions, startTime, endTime, breakInterval, eventType, theme } = req.body;
  if (!sessions?.length) return ApiResponse.error(res, 'Sessions array is required', 400);

  const agenda = await schedulerService.buildSmartSchedule({
    sessions, startTime, endTime, breakInterval, eventType, theme,
  });

  return ApiResponse.success(res, { agenda }, 'Schedule generated successfully');
});

// ─── Review Schedule ──────────────────────────────────────────────────────────
exports.reviewSchedule = asyncHandler(async (req, res) => {
  const { agenda, context } = req.body;
  const suggestions = await schedulerService.reviewAndImpoveSchedule(agenda, context);
  return ApiResponse.success(res, { suggestions }, 'Schedule review complete');
});

// ─── Chatbot ──────────────────────────────────────────────────────────────────
exports.chat = asyncHandler(async (req, res) => {
  const { message, conversationHistory, eventId } = req.body;
  if (!message?.trim()) return ApiResponse.error(res, 'Message is required', 400);

  const response = await chatbotService.processChat({
    message,
    conversationHistory: conversationHistory || [],
    userId:  req.user?._id,
    eventId,
  });

  const quickReplies = await chatbotService.getQuickReplies(response.message, eventId ? 'event page' : 'general');

  return ApiResponse.success(res, { ...response, quickReplies });
});

// ─── Get Recommendations ──────────────────────────────────────────────────────
exports.getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user) return ApiResponse.error(res, 'Authentication required', 401);

  const recommendations = await recommendService.getPersonalisedRecommendations(
    req.user._id,
    parseInt(req.query.limit) || 10
  );

  return ApiResponse.success(res, { events: recommendations }, 'Recommendations generated');
});

// ─── Similar Events ───────────────────────────────────────────────────────────
exports.getSimilarEvents = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const similar = await recommendService.getSimilarEvents(eventId, 6);
  return ApiResponse.success(res, { events: similar });
});
