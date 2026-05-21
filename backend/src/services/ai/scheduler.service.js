/**
 * AI Smart Schedule Builder
 * Generates optimized event agendas using Groq
 * Handles speaker availability, session flow, breaks, time optimization
 */

const { callGroq, validatePrompt } = require('./groq.service');
const { AI_MODELS } = require('../../utils/constants');

/**
 * Generate an optimized event schedule
 * @param {Object} input
 * @param {Array}  input.sessions     - Array of { title, duration, speaker, type, tags }
 * @param {string} input.startTime    - Event start time "09:00"
 * @param {string} input.endTime      - Event end time "18:00"
 * @param {number} input.breakInterval- Minutes between breaks (default: 90)
 * @param {string} input.eventType    - conference | workshop | meetup | hackathon
 * @param {string} input.theme        - Event theme/topic for flow optimization
 */
const buildSmartSchedule = async ({
  sessions,
  startTime    = '09:00',
  endTime      = '18:00',
  breakInterval = 90,
  eventType    = 'conference',
  theme        = '',
}) => {
  if (!sessions?.length) throw new Error('At least one session is required');

  const sessionsText = sessions.map((s, i) =>
    `${i + 1}. "${s.title}" | Speaker: ${s.speaker || 'TBD'} | Duration: ${s.duration}min | Type: ${s.type || 'session'} | Tags: ${(s.tags || []).join(', ')}`
  ).join('\n');

  const systemPrompt = `You are an expert event schedule optimizer for professional conferences and events.
Create an optimized, conflict-free agenda that:
- Maximizes audience engagement with strategic session ordering
- Places high-energy/keynote sessions at peak attention times (morning, post-lunch)
- Inserts appropriate breaks every ${breakInterval} minutes
- Groups related topics together for better flow
- Ensures smooth transitions between sessions
- Accounts for setup/teardown time between sessions

Return ONLY a valid JSON array of agenda items with this exact structure:
[
  {
    "time": "HH:MM AM/PM",
    "title": "string",
    "description": "brief 1-sentence description",
    "speaker": "speaker name or empty string",
    "duration": number (minutes),
    "type": "session|break|keynote|workshop|panel|networking",
    "room": "Main Hall or empty string"
  }
]

IMPORTANT: Include opening remarks, coffee breaks, lunch, and closing remarks automatically.`;

  const raw = await callGroq({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Build an optimized schedule:
Event Type: ${eventType}
Theme: ${validatePrompt(theme || 'General')}
Start Time: ${startTime}
End Time: ${endTime}
Break Every: ${breakInterval} minutes

Sessions to schedule:
${sessionsText}

Generate a complete, professional agenda.`,
      },
    ],
    model:       AI_MODELS.PRIMARY,
    maxTokens:   1500,
    temperature: 0.4,
    cacheKey:    null,
  });

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const agenda  = JSON.parse(cleaned);

    // Validate and sanitize output
    return agenda.map(item => ({
      time:        item.time        || '',
      title:       item.title       || 'Session',
      description: item.description || '',
      speaker:     item.speaker     || '',
      duration:    parseInt(item.duration) || 30,
      type:        ['session','break','keynote','workshop','panel','networking'].includes(item.type)
        ? item.type : 'session',
      room:        item.room        || '',
    }));
  } catch (err) {
    throw new Error('Failed to parse AI-generated schedule. Please try again.');
  }
};

/**
 * Suggest improvements for an existing agenda
 */
const reviewAndImpoveSchedule = async (existingAgenda, eventContext) => {
  const agendaText = existingAgenda.map(a =>
    `${a.time} — ${a.title} (${a.duration}min)`
  ).join('\n');

  const messages = [
    {
      role: 'system',
      content: 'You are an event planning expert. Review the agenda and provide 3-5 specific, actionable improvement suggestions. Be concise and practical. Return a JSON array of suggestion strings.',
    },
    {
      role: 'user',
      content: `Review this event agenda and suggest improvements:

Event Context: ${validatePrompt(eventContext || 'Professional conference')}

Current Agenda:
${agendaText}

Provide 3-5 specific improvement suggestions as a JSON array of strings.`,
    },
  ];

  const raw = await callGroq({
    messages,
    model:       AI_MODELS.SECONDARY,
    maxTokens:   400,
    temperature: 0.5,
    cacheKey:    null,
  });

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return ['Consider adding more networking breaks', 'Balance session lengths for better pacing'];
  }
};

module.exports = { buildSmartSchedule, reviewAndImpoveSchedule };
