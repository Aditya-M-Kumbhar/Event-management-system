const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/event/event.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const upload   = require('../middleware/upload.middleware');

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/',           optionalAuth, ctrl.getEvents);
router.get('/featured',   ctrl.getFeaturedEvents);
router.get('/trending',   ctrl.getTrendingEvents);
router.get('/slug/:slug', optionalAuth, ctrl.getEventBySlug);
router.get('/:id',        optionalAuth, ctrl.getEventById);

// ── Organiser Routes ──────────────────────────────────────────────────────────
router.use(protect);
router.get('/organiser/my-events', authorize('organiser','admin'), ctrl.getMyEvents);
router.get('/:id/analytics',       authorize('organiser','admin'), ctrl.getEventAnalytics);

router.post('/',
  authorize('organiser','admin'),
  upload.single('bannerImage'),
  ctrl.createEvent
);

router.put('/:id',
  authorize('organiser','admin'),
  upload.single('bannerImage'),
  ctrl.updateEvent
);

router.patch('/:id/publish', authorize('organiser','admin'), ctrl.publishEvent);
router.delete('/:id',        authorize('organiser','admin'), ctrl.deleteEvent);

module.exports = router;
