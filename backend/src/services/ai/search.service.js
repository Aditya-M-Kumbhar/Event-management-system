/**
 * AI Natural Language Search Service
 * Converts plain English queries into structured MongoDB event filters
 * Example: "Tech events under ₹500 in Pune this weekend" → { category, city, maxPrice, dateRange }
 */

const { callGroq, validatePrompt } = require('./groq.service');
const { AI_MODELS } = require('../../utils/constants');

const EVENT_CATEGORIES = [
  'Technology','Business','Music','Arts & Culture','Sports & Fitness',
  'Health & Wellness','Food & Drink','Education','Networking','Gaming',
  'Film & Media','Fashion','Travel','Social','Other',
];

/**
 * Parse a natural language search into MongoDB-compatible filters
 */
const parseNaturalLanguageSearch = async (userQuery) => {
  const sanitized = validatePrompt(userQuery);

  const today = new Date().toISOString().split('T')[0];
  const weekend = getUpcomingWeekend();

  const systemPrompt = `You are an event search query parser for an Indian event platform.
Convert user's natural language query into structured JSON search filters.

Available categories: ${EVENT_CATEGORIES.join(', ')}
Today's date: ${today}

Return ONLY a valid JSON object with these optional fields:
{
  "category": "string from available categories or null",
  "city": "city name or null",
  "format": "online|offline|null",
  "type": "free|paid|null",
  "maxPrice": number or null,
  "minPrice": number or null,
  "dateFrom": "YYYY-MM-DD or null",
  "dateTo": "YYYY-MM-DD or null",
  "sort": "newest|popular|trending|price_asc|price_desc|date_asc|null",
  "keywords": "remaining search terms for text search or null",
  "interpretation": "one sentence explaining what you understood"
}

RULES:
- "this weekend" = ${weekend.from} to ${weekend.to}
- "today" = ${today}
- "free" events → type: "free", maxPrice: 0
- Price mentions like "under ₹500" → maxPrice: 500
- "online" / "virtual" → format: "online"
- Match category loosely (e.g. "coding" → "Technology", "fitness" → "Sports & Fitness")
- Return null for fields not mentioned
- NEVER invent filters not present in the query`;

  const raw = await callGroq({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Parse this search query: "${sanitized}"` },
    ],
    model:       AI_MODELS.SECONDARY,
    maxTokens:   300,
    temperature: 0.2,
    cacheKey:    `nlsearch:${sanitized.toLowerCase().replace(/\s+/g, '-').substring(0, 60)}`,
  });

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    // Build MongoDB filter from parsed result
    const mongoFilter = buildMongoFilter(parsed);
    return { filters: mongoFilter, parsed, interpretation: parsed.interpretation };
  } catch {
    // Fallback: use original query as text search
    return {
      filters: { search: sanitized },
      parsed:  null,
      interpretation: `Searching for "${sanitized}"`,
    };
  }
};

/**
 * Convert parsed AI output to MongoDB-compatible query params
 */
const buildMongoFilter = (parsed) => {
  const filter = {};
  if (parsed.category)  filter.category = parsed.category;
  if (parsed.city)      filter.city     = parsed.city;
  if (parsed.format && parsed.format !== 'null') filter.format = parsed.format;
  if (parsed.type)      filter.type     = parsed.type;
  if (parsed.dateFrom)  filter.dateFrom = parsed.dateFrom;
  if (parsed.dateTo)    filter.dateTo   = parsed.dateTo;
  if (parsed.sort)      filter.sort     = parsed.sort;
  if (parsed.keywords)  filter.search   = parsed.keywords;

  // Price filtering — passed as query params to the event search
  if (parsed.maxPrice !== null && parsed.maxPrice !== undefined) {
    filter.maxPrice = parsed.maxPrice;
  }
  return filter;
};

/**
 * Get upcoming weekend dates
 */
const getUpcomingWeekend = () => {
  const now     = new Date();
  const day     = now.getDay(); // 0=Sun, 6=Sat
  const daysToSat = (6 - day + 7) % 7 || 7;
  const sat = new Date(now); sat.setDate(now.getDate() + daysToSat);
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return {
    from: sat.toISOString().split('T')[0],
    to:   sun.toISOString().split('T')[0],
  };
};

/**
 * Generate search suggestions based on trending topics
 */
const generateSearchSuggestions = async (partialQuery) => {
  if (!partialQuery || partialQuery.length < 3) return [];

  const messages = [
    {
      role: 'system',
      content: 'You are an autocomplete engine for an event platform. Generate 5 search suggestions. Return ONLY a JSON array of strings. No explanation.',
    },
    {
      role: 'user',
      content: `Generate event search autocomplete suggestions for: "${validatePrompt(partialQuery)}"`,
    },
  ];

  try {
    const raw = await callGroq({
      messages,
      model:       AI_MODELS.SECONDARY,
      maxTokens:   120,
      temperature: 0.7,
      cacheKey:    `suggest:${partialQuery.toLowerCase().trim()}`,
    });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
};

module.exports = { parseNaturalLanguageSearch, generateSearchSuggestions };
