/**
 * AI Recommendation Engine
 * Hybrid system: content-based filtering + Groq AI reasoning layer
 * Uses user's past attendance, wishlist, interests, and search history
 */

const { callGroq } = require('./groq.service');
const { AI_MODELS } = require('../../utils/constants');
const Event    = require('../../models/Event.model');
const Order    = require('../../models/Order.model');
const { Wishlist } = require('../../models/schemas');
const User     = require('../../models/User.model');

// ─── Build User Interest Profile ─────────────────────────────────────────────
const buildUserProfile = async (userId) => {
  const [user, orders, wishlists] = await Promise.all([
    User.findById(userId).select('interests searchHistory city'),
    Order.find({ user: userId, status: 'confirmed' })
      .populate('event', 'category tags title city format')
      .limit(20).sort({ createdAt: -1 }),
    Wishlist.find({ user: userId })
      .populate('event', 'category tags title city format')
      .limit(20).sort({ createdAt: -1 }),
  ]);

  // Extract attended categories and tags
  const attendedCategories = orders.map(o => o.event?.category).filter(Boolean);
  const attendedTags       = orders.flatMap(o => o.event?.tags || []);
  const wishlistCategories = wishlists.map(w => w.event?.category).filter(Boolean);
  const preferredCities    = [...new Set([
    user?.city,
    ...orders.map(o => o.event?.['venue.city']),
  ].filter(Boolean))];

  // Frequency map for categories
  const categoryFreq = {};
  [...attendedCategories, ...wishlistCategories].forEach(cat => {
    categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
  });

  const topCategories = Object.entries(categoryFreq)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5)
    .map(([cat]) => cat);

  return {
    userId: userId.toString(),
    topCategories,
    interests:       user?.interests || [],
    searchHistory:   user?.searchHistory?.slice(0, 10) || [],
    preferredCities,
    preferredFormat: orders.filter(o => o.event?.format === 'online').length > orders.length / 2
      ? 'online' : 'any',
    recentTags: [...new Set(attendedTags)].slice(0, 15),
    attendedEventIds: orders.map(o => o.event?._id?.toString()).filter(Boolean),
    wishlistedEventIds: wishlists.map(w => w.event?._id?.toString()).filter(Boolean),
  };
};

// ─── Content-Based Filtering ──────────────────────────────────────────────────
const getContentBasedRecommendations = async (userProfile, limit = 20) => {
  const { topCategories, preferredCities, preferredFormat, attendedEventIds, wishlistedEventIds, recentTags } = userProfile;

  const excludeIds = [...new Set([...attendedEventIds, ...wishlistedEventIds])];

  const filter = {
    status:    'published',
    isPublic:  true,
    startDate: { $gte: new Date() },
    ...(excludeIds.length && { _id: { $nin: excludeIds } }),
  };

  // Score-based retrieval: try top categories first
  let candidates = [];

  if (topCategories.length) {
    const byCat = await Event.find({ ...filter, category: { $in: topCategories } })
      .sort({ views: -1, wishlistCount: -1 })
      .limit(limit * 2)
      .select('_id title category tags format venue.city isFree minPrice startDate bannerImage slug averageRating totalSold');
    candidates.push(...byCat);
  }

  // Supplement with trending events if not enough
  if (candidates.length < limit) {
    const trending = await Event.find(filter)
      .sort({ wishlistCount: -1, views: -1 })
      .limit(limit)
      .select('_id title category tags format venue.city isFree minPrice startDate bannerImage slug averageRating totalSold');
    candidates.push(...trending);
  }

  // Deduplicate
  const seen = new Set();
  candidates = candidates.filter(e => {
    if (seen.has(e._id.toString())) return false;
    seen.add(e._id.toString()); return true;
  });

  // Score each candidate
  const scored = candidates.map(event => {
    let score = 0;
    if (topCategories.includes(event.category)) score += 30;
    if (preferredCities.includes(event.venue?.city)) score += 20;
    if (preferredFormat !== 'any' && event.format === preferredFormat) score += 15;
    const matchingTags = (event.tags || []).filter(t => recentTags.includes(t)).length;
    score += matchingTags * 5;
    score += Math.min(event.totalSold || 0, 100) * 0.1;
    score += (event.averageRating || 0) * 3;
    if (event.isFeatured) score += 10;
    return { event, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ event }) => event);
};

// ─── AI Reasoning Layer (Groq) ────────────────────────────────────────────────
const reRankWithAI = async (userProfile, candidateEvents) => {
  if (!candidateEvents.length) return [];

  const eventsText = candidateEvents.slice(0, 15).map((e, i) =>
    `${i + 1}. [${e._id}] "${e.title}" | Category: ${e.category} | Format: ${e.format} | City: ${e.venue?.city || 'Online'} | Price: ${e.isFree ? 'Free' : `₹${e.minPrice || 0}`} | Rating: ${e.averageRating || 'New'}`
  ).join('\n');

  const profileText = `
- Favourite categories: ${userProfile.topCategories.join(', ') || 'Not yet established'}
- Interests: ${userProfile.interests.join(', ') || 'General'}
- Location preference: ${userProfile.preferredCities.join(', ') || 'Any'}
- Recent searches: ${userProfile.searchHistory.join(', ') || 'None'}
- Preferred format: ${userProfile.preferredFormat}`;

  const messages = [
    {
      role: 'system',
      content: `You are an event recommendation AI. Re-rank events for a user based on their profile.
Return ONLY a JSON array of event IDs in recommended order (most relevant first).
Consider: category match, location, format preference, price sensitivity, interests.
Return max 10 IDs. Format: ["id1", "id2", ...]`,
    },
    {
      role: 'user',
      content: `Re-rank these events for the user:

USER PROFILE:${profileText}

CANDIDATE EVENTS:
${eventsText}

Return a JSON array of the top 10 event IDs in recommended order.`,
    },
  ];

  try {
    const raw = await callGroq({
      messages,
      model:       AI_MODELS.SECONDARY,
      maxTokens:   200,
      temperature: 0.3,
      cacheKey:    `rerank:${userProfile.userId}:${Date.now().toString().slice(0,-4)}`, // cache per minute
    });

    const cleaned  = raw.replace(/```json|```/g, '').trim();
    const rankedIds = JSON.parse(cleaned);

    // Re-order candidateEvents based on AI ranking
    const idMap    = new Map(candidateEvents.map(e => [e._id.toString(), e]));
    const reRanked = rankedIds.map(id => idMap.get(id)).filter(Boolean);

    // Append any events not mentioned by AI at the end
    const reRankedSet = new Set(rankedIds);
    const remaining   = candidateEvents.filter(e => !reRankedSet.has(e._id.toString()));

    return [...reRanked, ...remaining].slice(0, 10);
  } catch {
    // Fallback to content-based order
    return candidateEvents.slice(0, 10);
  }
};

// ─── Main Recommendation Function ─────────────────────────────────────────────
const getPersonalisedRecommendations = async (userId, limit = 10) => {
  try {
    const userProfile  = await buildUserProfile(userId);
    const candidates   = await getContentBasedRecommendations(userProfile, 20);

    // Use AI re-ranking if user has enough history
    const hasHistory   = userProfile.topCategories.length > 0 || userProfile.interests.length > 0;
    const finalResults = hasHistory
      ? await reRankWithAI(userProfile, candidates)
      : candidates.slice(0, limit);

    return finalResults;
  } catch (err) {
    // Fallback: return trending events
    return Event.find({ status: 'published', isPublic: true, startDate: { $gte: new Date() } })
      .sort({ wishlistCount: -1 })
      .limit(limit)
      .select('_id title category format venue.city isFree minPrice startDate bannerImage slug averageRating');
  }
};

/**
 * Similar events — for event detail page
 */
const getSimilarEvents = async (eventId, limit = 6) => {
  const event = await Event.findById(eventId).select('category tags venue.city isFree');
  if (!event) return [];

  return Event.find({
    _id:      { $ne: eventId },
    status:   'published',
    isPublic: true,
    startDate:{ $gte: new Date() },
    $or: [
      { category: event.category },
      { tags: { $in: event.tags || [] } },
    ],
  })
    .sort({ averageRating: -1, views: -1 })
    .limit(limit)
    .select('_id title category format venue.city isFree minPrice startDate bannerImage slug averageRating totalSold');
};

module.exports = {
  getPersonalisedRecommendations,
  getSimilarEvents,
  buildUserProfile,
};
