/**
 * EventSphere — API Routes Aggregator
 * All routes are prefixed with /api/v1
 */

const express = require('express');
const router  = express.Router();

router.use('/auth',          require('./auth.routes'));
router.use('/users',         require('./user.routes'));
router.use('/events',        require('./event.routes'));
router.use('/tickets',       require('./ticket.routes'));
router.use('/orders',        require('./order.routes'));
router.use('/payments',      require('./payment.routes'));
router.use('/checkin',       require('./checkin.routes'));
router.use('/reviews',       require('./review.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/wishlist',      require('./wishlist.routes'));
router.use('/coupons',       require('./coupon.routes'));
router.use('/admin',         require('./admin.routes'));
router.use('/ai',            require('./ai.routes'));

module.exports = router;
