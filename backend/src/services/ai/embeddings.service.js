/**
 * Embeddings / Text Similarity Service
 * Used for content-based event matching without external vector DB
 * Implements simple TF-IDF cosine similarity as fallback
 */

const { callGroq } = require('./groq.service');
const { AI_MODELS } = require('../../utils/constants');

/**
 * Compute simple keyword overlap score between two text blobs
 * Used when vector embeddings are not available
 */
const cosineSimilarity = (textA, textB) => {
  const tokenize = (t) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);
  const setA   = new Set(wordsA);
  const setB   = new Set(wordsB);

  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union        = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Rank a list of events by relevance to a user interest profile
 * Uses AI to assess semantic match when keyword overlap is low
 */
const rankEventsByRelevance = async (events, userProfile) => {
  const profileText = [
    ...userProfile.interests,
    ...userProfile.topCategories,
    ...userProfile.recentTags,
  ].join(' ');

  return events
    .map(event => {
      const eventText = `${event.title} ${event.category} ${(event.tags || []).join(' ')}`;
      const score     = cosineSimilarity(profileText, eventText);
      return { event, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ event }) => event);
};

/**
 * Extract key topics from a text using Groq
 */
const extractTopics = async (text) => {
  if (!text || text.length < 20) return [];

  try {
    const raw = await callGroq({
      messages: [
        {
          role: 'system',
          content: 'Extract 5 key topic tags from the text. Return ONLY a JSON array of lowercase strings. No explanation.',
        },
        { role: 'user', content: text.substring(0, 1000) },
      ],
      model:       AI_MODELS.SECONDARY,
      maxTokens:   80,
      temperature: 0.3,
      cacheKey:    `topics:${text.substring(0, 40).replace(/\s+/g, '-')}`,
    });

    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
};

module.exports = { cosineSimilarity, rankEventsByRelevance, extractTopics };
