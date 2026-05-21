const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/admin/admin.controller');
const { protect }   = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect, authorize('admin'));

// Platform
router.get('/stats',                   ctrl.getPlatformStats);

// Users
router.get('/users',                   ctrl.getUsers);
router.patch('/users/:id/ban',         ctrl.banUser);
router.patch('/users/:id/role',        ctrl.updateUserRole);

// Events
router.get('/events',                  ctrl.getAllEvents);
router.patch('/events/:id/visibility', ctrl.toggleEventVisibility);
router.patch('/events/:id/feature',    ctrl.featureEvent);
router.delete('/events/:id',           ctrl.deleteEvent);

// Reviews
router.delete('/reviews/:id',          ctrl.deleteReview);

// Refunds
router.get('/refunds',                 ctrl.getPendingRefunds);
router.post('/refunds/:orderId/process',
  require('../controllers/payment/razorpay.controller').processRefund
);

module.exports = router;
