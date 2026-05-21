/**
 * Order Controller — Multi-ticket checkout, order management, CSV export
 */

const Order   = require('../../models/Order.model');
const Event   = require('../../models/Event.model');
const Ticket  = require('../../models/Ticket.model');
const { Coupon, Notification } = require('../../models/schemas');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const qrService    = require('../../services/qr/qr.service');
const emailService = require('../../services/email/email.service');
const notificationService = require('../../services/notification/notification.service');
const { v4: uuidv4 } = require('uuid');

// Generate order ID
const generateOrderId = () => {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substring(2,7).toUpperCase();
  return `ORD-${date}-${rand}`;
};

// Generate ticket ID
const generateTicketId = () => {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).substring(2,7).toUpperCase();
  return `ES-${date}-${rand}`;
};

// ─── Create Order (before payment) ───────────────────────────────────────────
exports.createOrder = asyncHandler(async (req, res) => {
  const { eventId, items, couponCode } = req.body;
  // items: [{ ticketTypeId, quantity }]

  const event = await Event.findById(eventId);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);
  if (event.status !== 'published') return ApiResponse.error(res, 'Event is not available', 400);
  if (new Date() > event.endDate)  return ApiResponse.error(res, 'Event has ended', 400);

  // Build order items and validate capacity
  const orderItems  = [];
  let   subtotal    = 0;

  for (const item of items) {
    const ticketType = event.ticketTypes.id(item.ticketTypeId);
    if (!ticketType)        return ApiResponse.error(res, `Ticket type not found: ${item.ticketTypeId}`, 404);
    if (!ticketType.isActive) return ApiResponse.error(res, `Ticket "${ticketType.name}" is not available`, 400);

    const available = ticketType.capacity - ticketType.sold;
    if (item.quantity > available) {
      return ApiResponse.error(res, `Only ${available} tickets left for "${ticketType.name}"`, 400);
    }
    if (item.quantity > ticketType.maxPerUser) {
      return ApiResponse.error(res, `Max ${ticketType.maxPerUser} tickets per user for "${ticketType.name}"`, 400);
    }
    if (ticketType.saleEndDate && new Date() > ticketType.saleEndDate) {
      return ApiResponse.error(res, `Sale for "${ticketType.name}" has ended`, 400);
    }

    const itemSubtotal = ticketType.price * item.quantity;
    subtotal += itemSubtotal;
    orderItems.push({
      ticketTypeId:   item.ticketTypeId,
      ticketTypeName: ticketType.name,
      price:          ticketType.price,
      quantity:       item.quantity,
      subtotal:       itemSubtotal,
    });
  }

  // Apply coupon
  let discountAmount = 0;
  let appliedCoupon  = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), event: eventId });
    if (!coupon) return ApiResponse.error(res, 'Invalid coupon code', 400);
    const validity = coupon.isValid(req.user._id, subtotal);
    if (!validity.valid) return ApiResponse.error(res, validity.reason, 400);
    discountAmount = coupon.calculateDiscount(subtotal);
    appliedCoupon  = coupon;
  }

  const taxAmount   = Math.round((subtotal - discountAmount) * 0.18);
  const totalAmount = subtotal - discountAmount + taxAmount;

  const order = await Order.create({
    orderId:  generateOrderId(),
    user:     req.user._id,
    event:    eventId,
    items:    orderItems,
    subtotal,
    taxAmount,
    discountAmount,
    couponCode: couponCode || '',
    totalAmount,
    status:   'pending',
    attendeeSnapshot: {
      name:  req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
    },
  });

  return ApiResponse.created(res, { order }, 'Order created. Proceed to payment.');
});

// ─── Confirm Order (called after payment verification) ────────────────────────
exports.confirmOrder = async (orderId, paymentId) => {
  const order = await Order.findById(orderId).populate('event');
  if (!order) throw new Error('Order not found');
  if (order.status === 'confirmed') return order; // already confirmed

  const event = order.event;

  // Generate tickets
  const tickets = [];
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const ticketId  = generateTicketId();
      const qrPayload = JSON.stringify({
        ticketId,
        eventId:  event._id.toString(),
        orderId:  order._id.toString(),
        attendee: order.attendeeSnapshot.name,
      });
      const qrCode = await qrService.generateQR(qrPayload);

      const ticket = await Ticket.create({
        ticketId,
        order:   order._id,
        event:   event._id,
        attendee:order.user,
        ticketType:     item.ticketTypeId,
        ticketTypeName: item.ticketTypeName,
        price:   item.price,
        qrCode,
        qrCodeData: qrPayload,
        attendeeInfo: order.attendeeSnapshot,
      });
      tickets.push(ticket);

      // Update ticket type sold count
      await Event.updateOne(
        { _id: event._id, 'ticketTypes._id': item.ticketTypeId },
        { $inc: { 'ticketTypes.$.sold': 1, totalSold: 1, totalRevenue: item.price } }
      );
    }
  }

  // Link tickets & confirm order
  order.status  = 'confirmed';
  order.tickets = tickets.map(t => t._id);
  order.payment = paymentId;
  await order.save();

  // Apply coupon usage
  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode, event: event._id },
      { $inc: { usedCount: 1 }, $push: { usedBy: order.user } }
    );
  }

  // Send confirmation email & in-app notification (non-blocking)
  emailService.sendTicketConfirmation(order, tickets, event).catch(() => {});
  notificationService.create({
    user:    order.user,
    type:    'ticket_confirmed',
    title:   '🎉 Booking Confirmed!',
    message: `Your tickets for "${event.title}" are ready.`,
    link:    `/my-tickets`,
  }).catch(() => {});

  return order;
};

// ─── Get My Orders ────────────────────────────────────────────────────────────
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit)
      .populate('event', 'title slug bannerImage startDate venue format'),
    Order.countDocuments({ user: req.user._id }),
  ]);
  return ApiResponse.paginated(res, orders, getPaginationMeta(total, page, limit));
});

// ─── Get Order Details ────────────────────────────────────────────────────────
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('event', 'title slug bannerImage startDate endDate venue format organiser')
    .populate({ path: 'tickets', select: '-qrCode' });

  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }
  return ApiResponse.success(res, order);
});

// ─── Request Refund ───────────────────────────────────────────────────────────
exports.requestRefund = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id).populate('event');

  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  if (order.user.toString() !== req.user._id.toString()) return ApiResponse.error(res, 'Not authorized', 403);
  if (order.status !== 'confirmed') return ApiResponse.error(res, 'Only confirmed orders can be refunded', 400);

  // Check event refund policy
  if (order.event.refundPolicy === 'no_refund') {
    return ApiResponse.error(res, 'This event has a no-refund policy', 400);
  }

  order.status           = 'refund_requested';
  order.refundReason     = reason;
  order.refundRequestedAt= new Date();
  await order.save();

  notificationService.create({
    user:    order.user,
    type:    'refund_status',
    title:   'Refund Requested',
    message: 'Your refund request has been submitted and is under review.',
    link:    `/my-tickets`,
  }).catch(() => {});

  return ApiResponse.success(res, {}, 'Refund request submitted successfully');
});

// ─── Export Attendees CSV (Organiser) ─────────────────────────────────────────
exports.exportAttendeesCsv = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findById(eventId);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);
  if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const tickets = await Ticket.find({ event: eventId })
    .populate('attendee', 'name email phone')
    .sort({ createdAt: 1 });

  const rows = tickets.map((t, i) => ({
    '#':            i + 1,
    'Ticket ID':    t.ticketId,
    'Name':         t.attendee?.name || t.attendeeInfo?.name,
    'Email':        t.attendee?.email || t.attendeeInfo?.email,
    'Ticket Type':  t.ticketTypeName,
    'Price':        `₹${t.price}`,
    'Checked In':   t.isCheckedIn ? 'Yes' : 'No',
    'Check-In Time':t.checkedInAt ? new Date(t.checkedInAt).toLocaleString('en-IN') : '-',
    'Booked At':    new Date(t.createdAt).toLocaleString('en-IN'),
  }));

  const { createObjectCsvWriter } = require('csv-writer');
  const path = require('path');
  const os   = require('os');
  const filePath = path.join(os.tmpdir(), `attendees-${eventId}.csv`);

  const csvWriter = createObjectCsvWriter({
    path:   filePath,
    header: Object.keys(rows[0] || {}).map(k => ({ id: k, title: k })),
  });
  await csvWriter.writeRecords(rows);

  res.download(filePath, `${event.slug}-attendees.csv`, () => {
    require('fs').unlinkSync(filePath);
  });
});
