/**
 * Payment Controller — Razorpay Integration
 */

const Order   = require('../../models/Order.model');
const { Payment } = require('../../models/schemas');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const razorpayService = require('../../services/payment/razorpay.service');
const orderController = require('../order/order.controller');

// ─── Initiate Payment ─────────────────────────────────────────────────────────
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order)  return ApiResponse.error(res, 'Order not found', 404);
  if (order.user.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }
  if (order.status !== 'pending') {
    return ApiResponse.error(res, 'Order is no longer pending', 400);
  }

  // For free orders, skip payment
  if (order.totalAmount === 0) {
    await orderController.confirmOrder(order._id, null);
    return ApiResponse.success(res, { free: true }, 'Free tickets confirmed!');
  }

  // Create Razorpay order
  const rzpOrder = await razorpayService.createRazorpayOrder(
    order.totalAmount,
    order.currency,
    order.orderId
  );

  // Create pending payment record
  await Payment.create({
    order:           order._id,
    user:            req.user._id,
    razorpayOrderId: rzpOrder.id,
    amount:          order.totalAmount,
    currency:        order.currency,
    status:          'pending',
  });

  return ApiResponse.success(res, {
    razorpayOrderId: rzpOrder.id,
    amount:          rzpOrder.amount,
    currency:        rzpOrder.currency,
    keyId:           process.env.RAZORPAY_KEY_ID,
    orderDetails: {
      orderId:    order.orderId,
      totalAmount:order.totalAmount,
      name:       req.user.name,
      email:      req.user.email,
    },
  }, 'Payment initiated');
});

// ─── Verify Payment (called by frontend after Razorpay success) ───────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId,
  } = req.body;

  // Verify signature
  const isValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId, razorpayPaymentId, razorpaySignature
  );
  if (!isValid) {
    return ApiResponse.error(res, 'Payment verification failed. Invalid signature.', 400);
  }

  // Update payment record
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'success',
    },
    { new: true }
  );

  if (!payment) return ApiResponse.error(res, 'Payment record not found', 404);

  // Confirm the order → generates tickets
  const order = await orderController.confirmOrder(orderId, payment._id);

  return ApiResponse.success(res, {
    orderId:    order.orderId,
    ticketCount:order.tickets.length,
  }, 'Payment successful! Your tickets are ready.');
});

// ─── Razorpay Webhook (server-to-server) ──────────────────────────────────────
exports.handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    const crypto   = require('crypto');
    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    if (expected !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const { event, payload } = req.body;

  if (event === 'payment.failed') {
    const { order_id } = payload.payment.entity;
    await Payment.findOneAndUpdate(
      { razorpayOrderId: order_id },
      { status: 'failed' }
    );
  }

  res.status(200).json({ received: true });
});

// ─── Admin: Process Refund ────────────────────────────────────────────────────
exports.processRefund = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order   = await Order.findById(orderId).populate('payment');

  if (!order)    return ApiResponse.error(res, 'Order not found', 404);
  if (order.status !== 'refund_requested') {
    return ApiResponse.error(res, 'Order is not in refund_requested status', 400);
  }

  const payment = order.payment;
  if (!payment?.razorpayPaymentId) {
    return ApiResponse.error(res, 'Payment record not found', 404);
  }

  const refundAmount = order.event.refundPolicy === 'full'
    ? order.totalAmount
    : Math.round(order.totalAmount * 0.5);

  const refund = await razorpayService.initiateRefund(payment.razorpayPaymentId, refundAmount);

  // Update records
  payment.status       = 'refunded';
  payment.refundId     = refund.id;
  payment.refundAmount = refundAmount;
  payment.refundedAt   = new Date();
  await payment.save();

  order.status           = 'refunded';
  order.refundProcessedAt= new Date();
  await order.save();

  // Reverse ticket sold counts
  const Event  = require('../../models/Event.model');
  const Ticket = require('../../models/Ticket.model');
  await Ticket.updateMany({ order: order._id }, { isRefunded: true });
  for (const item of order.items) {
    await Event.updateOne(
      { _id: order.event, 'ticketTypes._id': item.ticketTypeId },
      { $inc: { 'ticketTypes.$.sold': -item.quantity, totalSold: -item.quantity, totalRevenue: -item.subtotal } }
    );
  }

  return ApiResponse.success(res, { refundAmount }, `Refund of ₹${refundAmount} processed.`);
});
