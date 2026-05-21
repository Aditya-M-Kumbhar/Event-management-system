const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/payment/razorpay.controller');
const { protect }    = require('../middleware/auth.middleware');
const { authorize }  = require('../middleware/role.middleware');
const { paymentLimiter } = require('../middleware/rateLimiter.middleware');

// Webhook — must be before protect middleware (no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

// Authenticated
router.use(protect);
router.post('/initiate', paymentLimiter, ctrl.initiatePayment);
router.post('/verify',   paymentLimiter, ctrl.verifyPayment);

// Admin only
router.post('/refund/:orderId', authorize('admin'), ctrl.processRefund);

module.exports = router;
