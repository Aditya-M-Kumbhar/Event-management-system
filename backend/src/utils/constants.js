module.exports = {
  USER_ROLES: {
    ADMIN:     'admin',
    ORGANISER: 'organiser',
    ATTENDEE:  'attendee',
  },

  EVENT_STATUS: {
    DRAFT:     'draft',
    PUBLISHED: 'published',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  },

  EVENT_CATEGORIES: [
    'Technology', 'Business', 'Music', 'Arts & Culture',
    'Sports & Fitness', 'Health & Wellness', 'Food & Drink',
    'Education', 'Networking', 'Gaming', 'Film & Media',
    'Fashion', 'Travel', 'Social', 'Other',
  ],

  TICKET_TYPES: {
    FREE:        'free',
    PAID:        'paid',
    VIP:         'vip',
    EARLY_BIRD:  'early_bird',
    GENERAL:     'general',
  },

  ORDER_STATUS: {
    PENDING:   'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    REFUNDED:  'refunded',
  },

  PAYMENT_STATUS: {
    PENDING:  'pending',
    SUCCESS:  'success',
    FAILED:   'failed',
    REFUNDED: 'refunded',
  },

  NOTIFICATION_TYPES: {
    TICKET_CONFIRMED:  'ticket_confirmed',
    EVENT_REMINDER:    'event_reminder',
    EVENT_UPDATED:     'event_updated',
    EVENT_CANCELLED:   'event_cancelled',
    REFUND_STATUS:     'refund_status',
    WISHLIST_REMINDER: 'wishlist_reminder',
    REVIEW_REQUEST:    'review_request',
  },

  // Groq AI Models
  AI_MODELS: {
    PRIMARY:   'llama-3.3-70b-versatile',
    SECONDARY: 'mixtral-8x7b-32768',
  },

  // AI Rate limits
  AI_RATE_LIMIT: {
    WINDOW_MS:   60 * 1000, // 1 minute
    MAX_REQUESTS: 10,
  },
};
