/**
 * AI Event Description Generator
 * Uses Groq llama-3.3-70b-versatile to generate professional event copy
 */

const { callGroq, validatePrompt } = require('./groq.service');
const { AI_MODELS } = require('../../utils/constants');

/**
 * Generate a full professional event description
 */
const generateEventDescription = async ({ topic, bulletPoints, audience, tone, category }) => {
  const sanitizedTopic    = validatePrompt(topic);
  const sanitizedBullets  = validatePrompt(bulletPoints);

  const messages = [
    {
      role: 'system',
      content: `You are an expert event copywriter for a professional event management platform.
You write compelling, SEO-friendly event descriptions that drive registrations.
RULES:
- Always write in the requested tone
- Structure with clear sections: Overview, What You'll Learn/Experience, Who Should Attend, Highlights
- Use markdown formatting (##, **, bullet points)
- Keep descriptions between 300-500 words
- Make it exciting but professional
- Never fabricate speaker names or specific claims not provided
- Do not include placeholder text like [Your Name] or [Date]`,
    },
    {
      role: 'user',
      content: `Generate a professional event description for:

**Event Topic:** ${sanitizedTopic}
**Category:** ${category || 'General'}
**Target Audience:** ${audience || 'General public'}
**Tone:** ${tone || 'Professional and engaging'}
**Key Points to Cover:**
${sanitizedBullets}

Write a complete, publication-ready event description.`,
    },
  ];

  return callGroq({
    messages,
    model:       AI_MODELS.PRIMARY,
    maxTokens:   800,
    temperature: 0.75,
    cacheKey:    null, // Don't cache — each generation should be unique
  });
};

/**
 * Generate SEO meta description (short, 150 chars)
 */
const generateMetaDescription = async ({ title, description }) => {
  const messages = [
    {
      role: 'system',
      content: 'You are an SEO expert. Generate concise meta descriptions under 155 characters. Return only the meta description text, nothing else.',
    },
    {
      role: 'user',
      content: `Event: "${validatePrompt(title)}"
Description preview: ${validatePrompt(description).substring(0, 300)}

Generate a compelling 155-character meta description.`,
    },
  ];

  return callGroq({
    messages,
    model:       AI_MODELS.SECONDARY,
    maxTokens:   80,
    temperature: 0.5,
    cacheKey:    `meta:${title.substring(0,30)}`,
  });
};

/**
 * Generate FAQ suggestions based on event details
 */
const generateFAQs = async ({ title, description, format, category }) => {
  const messages = [
    {
      role: 'system',
      content: `You are an event management expert. Generate realistic FAQs that attendees commonly ask.
Return ONLY a valid JSON array of objects with "question" and "answer" fields. No markdown, no extra text.`,
    },
    {
      role: 'user',
      content: `Generate 5 relevant FAQs for this event:
Title: ${validatePrompt(title)}
Format: ${format}
Category: ${category}
Description: ${validatePrompt(description).substring(0, 500)}`,
    },
  ];

  const raw = await callGroq({
    messages,
    model:       AI_MODELS.SECONDARY,
    maxTokens:   600,
    temperature: 0.6,
    cacheKey:    `faqs:${title.substring(0,30)}:${category}`,
  });

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
};

/**
 * Generate marketing tagline
 */
const generateTagline = async ({ title, category, audience }) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a creative marketing copywriter. Write short, punchy event taglines. Return only the tagline — no quotes, no explanation.',
    },
    {
      role: 'user',
      content: `Create a one-line tagline (max 12 words) for:
Event: ${validatePrompt(title)}
Category: ${category}
Audience: ${audience || 'general'}`,
    },
  ];

  return callGroq({
    messages,
    model:       AI_MODELS.SECONDARY,
    maxTokens:   40,
    temperature: 0.9,
    cacheKey:    null,
  });
};

module.exports = {
  generateEventDescription,
  generateMetaDescription,
  generateFAQs,
  generateTagline,
};
