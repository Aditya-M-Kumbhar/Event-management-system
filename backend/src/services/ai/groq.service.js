/**
 * Groq AI Base Service
 * Handles all Groq API calls with retry logic, caching, and security
 * ONLY uses Groq — no OpenAI or other providers
 */

const Groq      = require('groq-sdk');
const NodeCache = require('node-cache');
const logger    = require('../../utils/logger');
const { AI_MODELS } = require('../../utils/constants');

const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5-min default TTL

// ─── Prompt injection prevention ──────────────────────────────────────────────
const INJECTION_PATTERNS = [
  /ignore (previous|all|above) instructions/i,
  /you are now/i,
  /act as (a different|another|new)/i,
  /system prompt/i,
  /jailbreak/i,
  /DAN mode/i,
  /\[INST\]/i,
  /<\|.*\|>/,
];

const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') throw new Error('Invalid prompt');
  if (prompt.length > 8000) throw new Error('Prompt too long (max 8000 chars)');
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(prompt)) throw new Error('Invalid prompt content detected');
  }
  return prompt.trim();
};

// ─── Core Groq caller with retry ──────────────────────────────────────────────
const callGroq = async ({
  messages,
  model     = AI_MODELS.PRIMARY,
  maxTokens = 1024,
  temperature = 0.7,
  cacheKey  = null,
  retries   = 2,
  timeout   = 30000,
}) => {
  // Check cache
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug(`Groq cache hit: ${cacheKey}`);
      return cached;
    }
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const completion = await groq.chat.completions.create({
        messages,
        model,
        max_tokens:  maxTokens,
        temperature,
        stream:      false,
      });

      clearTimeout(timer);

      const result = completion.choices[0]?.message?.content || '';

      // Store in cache
      if (cacheKey && result) {
        cache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      lastError = error;
      if (error.name === 'AbortError') {
        logger.warn(`Groq timeout on attempt ${attempt + 1}`);
      } else if (error.status === 429) {
        // Rate limited — wait before retry
        const waitMs = Math.pow(2, attempt) * 1000;
        logger.warn(`Groq rate limited. Waiting ${waitMs}ms before retry ${attempt + 1}`);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        logger.error(`Groq error: ${error.message}`);
        if (attempt === retries) break;
      }
    }
  }

  logger.error(`Groq failed after ${retries + 1} attempts: ${lastError?.message}`);
  throw new Error('AI service temporarily unavailable. Please try again.');
};

// ─── Stream response (for chatbot) ───────────────────────────────────────────
const streamGroq = async ({ messages, model = AI_MODELS.PRIMARY, maxTokens = 512, onChunk }) => {
  const stream = await groq.chat.completions.create({
    messages,
    model,
    max_tokens: maxTokens,
    stream:     true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    fullText += text;
    if (onChunk) onChunk(text);
  }
  return fullText;
};

// ─── Clear cache ──────────────────────────────────────────────────────────────
const clearCache = (key) => key ? cache.del(key) : cache.flushAll();

module.exports = { callGroq, streamGroq, validatePrompt, clearCache, cache };
