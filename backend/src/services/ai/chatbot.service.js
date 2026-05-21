/**
 * AI Chatbot Service
 * Context-aware assistant for event recommendations, FAQs, and ticketing support
 */

const { callGroq, streamGroq, validatePrompt } = require('./groq.service');
const { AI_MODELS } = require('../../utils/constants');
const Event = require('../../models/Event.model');

const SYSTEM_PROMPT = `You are EventBot, the AI assistant for EventSphere — an AI-powered event management and ticketing platform.

YOUR CAPABILITIES:
- Recommend events based on user preferences and queries
- Answer questions about specific events (tickets, venue, schedule, speakers)
- Help with ticketing support (booking, refunds, QR codes, check-in)
- Guide organisers on creating better events
- Provide platform navigation help

PERSONALITY:
- Friendly, helpful, and concise
- Use emojis sparingly but appropriately 🎉
- Always stay on topic (events and the platform)
- If you don't know something specific, say so honestly

RESTRICTIONS:
- Only discuss event-related topics
- Never make up event details you don't have
- Never share personal user data
- Keep responses under 150 words unless detailed help is needed
- Do not discuss competitors or unrelated topics

PLATFORM INFO:
- EventSphere supports free and paid events
- Payment via Razorpay (UPI, cards, net banking)
- QR tickets sent to email after booking
- Organisers can create events with AI-assisted descriptions and schedules
- Categories: Technology, Business, Music, Arts & Culture, Sports, Health, Food, Education, Networking, Gaming, Film, Fashion, Travel, Social`;

/**
 * Process a chat message and return AI response
 */
const processChat = async ({ message, conversationHistory = [], userId, eventId }) => {
  const sanitized = validatePrompt(message);

  // Build context: if user is asking about a specific event, fetch its details
  let eventContext = '';
  if (eventId) {
    try {
      const event = await Event.findById(eventId)
        .select('title description category startDate venue format ticketTypes faqs speakers');
      if (event) {
        eventContext = `\n\nCURRENT EVENT CONTEXT:
Title: ${event.title}
Category: ${event.category}
Date: ${new Date(event.startDate).toLocaleDateString('en-IN')}
Format: ${event.format}
Location: ${event.format === 'online' ? 'Online' : `${event.venue?.name}, ${event.venue?.city}`}
Tickets: ${event.ticketTypes?.map(t => `${t.name} (₹${t.price})`).join(', ')}`;
      }
    } catch { /* ignore */ }
  }

  // Build message history (last 8 turns for context)
  const history = conversationHistory.slice(-8).map(turn => ({
    role:    turn.role,
    content: turn.content,
  }));

  const messages = [
    {
      role:    'system',
      content: SYSTEM_PROMPT + eventContext,
    },
    ...history,
    { role: 'user', content: sanitized },
  ];

  const response = await callGroq({
    messages,
    model:       AI_MODELS.PRIMARY,
    maxTokens:   300,
    temperature: 0.7,
    cacheKey:    null, // never cache chat responses
  });

  return {
    message:  response,
    role:     'assistant',
    timestamp:new Date().toISOString(),
  };
};

/**
 * Get quick reply suggestions after a bot response
 */
const getQuickReplies = async (lastBotMessage, context) => {
  const messages = [
    {
      role: 'system',
      content: 'Generate 3 short follow-up question suggestions for a chatbot conversation about events. Return ONLY a JSON array of 3 short strings (max 8 words each). No explanation.',
    },
    {
      role: 'user',
      content: `Bot just said: "${lastBotMessage.substring(0, 200)}"
Context: ${context || 'general event inquiry'}
Generate 3 natural follow-up questions.`,
    },
  ];

  try {
    const raw = await callGroq({
      messages,
      model:       AI_MODELS.SECONDARY,
      maxTokens:   100,
      temperature: 0.8,
      cacheKey:    null,
    });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      'Tell me more about tickets',
      'How do I get a refund?',
      'What events are near me?',
    ];
  }
};

module.exports = { processChat, getQuickReplies };
