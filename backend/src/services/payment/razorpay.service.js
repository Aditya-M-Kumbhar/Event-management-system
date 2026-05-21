/**
 * Razorpay Payment Service
 * Creates payment orders and verifies signatures
 */

const crypto   = require('crypto');
const razorpay = require('../../config/razorpay');

/**
 * Create Razorpay order
 */
const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
  const options = {
    amount:   Math.round(amount * 100),   // paise
    currency,
    receipt,
    payment_capture: 1,
  };
  return razorpay.orders.create(options);
};

/**
 * Verify Razorpay payment signature
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body      = `${orderId}|${paymentId}`;
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
};

/**
 * Initiate refund for a payment
 */
const initiateRefund = async (paymentId, amount) => {
  return razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    speed:  'normal',
  });
};

module.exports = { createRazorpayOrder, verifyPaymentSignature, initiateRefund };
