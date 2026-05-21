// ───────────────────────────────────────────────────────────────────────
// review.routes.js
// ───────────────────────────────────────────────────────────────────────
const express  = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse  = require('../utils/apiResponse');
const { Review }   = require('../models/schemas');
const Order        = require('../models/Order.model');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

const reviewRouter = express.Router();

// Get reviews for an event
reviewRouter.get('/event/:eventId', optionalAuth, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ event: req.params.eventId, isPublic: true })
      .sort(sort).skip(skip).limit(parseInt(limit))
      .populate('user', 'name avatar'),
    Review.countDocuments({ event: req.params.eventId, isPublic: true }),
  ]);
  return ApiResponse.paginated(res, reviews, { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) });
}));

// Create review (must have attended)
reviewRouter.post('/', protect, asyncHandler(async (req, res) => {
  const { eventId, rating, title, body } = req.body;
  const attended = await Order.findOne({ user: req.user._id, event: eventId, status: 'confirmed' });
  if (!attended) return ApiResponse.error(res, 'You must attend the event to leave a review', 403);

  const existing = await Review.findOne({ user: req.user._id, event: eventId });
  if (existing)   return ApiResponse.error(res, 'You have already reviewed this event', 409);

  const review = await Review.create({
    event: eventId, user: req.user._id, order: attended._id,
    rating, title, body, isPublic: true,
  });
  return ApiResponse.created(res, review, 'Review submitted');
}));

// Delete own review
reviewRouter.delete('/:id', protect, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return ApiResponse.error(res, 'Review not found', 404);
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }
  await review.deleteOne();
  return ApiResponse.success(res, {}, 'Review deleted');
}));

// ───────────────────────────────────────────────────────────────────────
// wishlist.routes.js
// ───────────────────────────────────────────────────────────────────────
const wishlistRouter = express.Router();
const { Wishlist } = require('../models/schemas');
const Event = require('../models/Event.model');

wishlistRouter.use(protect);

wishlistRouter.get('/', asyncHandler(async (req, res) => {
  const items = await Wishlist.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('event', 'title slug bannerImage startDate venue format isFree minPrice averageRating totalSold');
  return ApiResponse.success(res, items);
}));

wishlistRouter.post('/toggle', asyncHandler(async (req, res) => {
  const { eventId } = req.body;
  const event = await Event.findById(eventId);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  const existing = await Wishlist.findOne({ user: req.user._id, event: eventId });
  if (existing) {
    await existing.deleteOne();
    await Event.findByIdAndUpdate(eventId, { $inc: { wishlistCount: -1 } });
    return ApiResponse.success(res, { wishlisted: false }, 'Removed from wishlist');
  }
  await Wishlist.create({ user: req.user._id, event: eventId });
  await Event.findByIdAndUpdate(eventId, { $inc: { wishlistCount: 1 } });
  return ApiResponse.success(res, { wishlisted: true }, 'Added to wishlist');
}));

// ───────────────────────────────────────────────────────────────────────
// coupon.routes.js
// ───────────────────────────────────────────────────────────────────────
const couponRouter = express.Router();
const { Coupon } = require('../models/schemas');
const { authorize } = require('../middleware/role.middleware');

// Validate coupon (public)
couponRouter.post('/validate', protect, asyncHandler(async (req, res) => {
  const { code, eventId, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase(), event: eventId });
  if (!coupon) return ApiResponse.error(res, 'Invalid coupon code', 404);

  const validity = coupon.isValid(req.user._id, orderAmount);
  if (!validity.valid) return ApiResponse.error(res, validity.reason, 400);

  const discountAmount = coupon.calculateDiscount(orderAmount);
  return ApiResponse.success(res, {
    valid: true, discountAmount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
}));

// Organiser: create coupon
couponRouter.post('/', protect, authorize('organiser','admin'), asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, organiser: req.user._id });
  return ApiResponse.created(res, coupon, 'Coupon created');
}));

// Organiser: get their coupons
couponRouter.get('/', protect, authorize('organiser','admin'), asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ organiser: req.user._id }).sort({ createdAt: -1 });
  return ApiResponse.success(res, coupons);
}));

couponRouter.delete('/:id', protect, authorize('organiser','admin'), asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  return ApiResponse.success(res, {}, 'Coupon deleted');
}));

// ───────────────────────────────────────────────────────────────────────
// user.routes.js
// ───────────────────────────────────────────────────────────────────────
const userRouter = express.Router();
const User    = require('../models/User.model');
const upload  = require('../middleware/upload.middleware');
const cloudinaryService = require('../services/storage/cloudinary.service');

userRouter.use(protect);

userRouter.get('/profile', asyncHandler(async (req, res) => {
  return ApiResponse.success(res, req.user.toSafeObject());
}));

userRouter.put('/profile', upload.single('avatar'), asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) {
    if (req.user.avatar) await cloudinaryService.deleteImage(req.user.avatar);
    const result = await cloudinaryService.uploadAvatar(req.file.buffer);
    updates.avatar = result.secure_url;
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  return ApiResponse.success(res, user.toSafeObject(), 'Profile updated');
}));

userRouter.get('/organiser/stats', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const Event_ = require('../models/Event.model');
  const Order_ = require('../models/Order.model');

  const myEvents = await Event_.find({ organiser: req.user._id }).select('_id title totalSold totalCapacity totalRevenue views checkedIn');
  const eventIds = myEvents.map(e => e._id);

  const [orders, revenueByDay] = await Promise.all([
    Order_.find({ event: { $in: eventIds }, status: 'confirmed', createdAt: { $gte: since } }),
    Order_.aggregate([
      { $match: { event: { $in: eventIds }, status: 'confirmed', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalRevenue  = orders.reduce((s, o) => s + o.totalAmount, 0);
  const ticketsSold   = orders.reduce((s, o) => s + o.items.reduce((t, i) => t + i.quantity, 0), 0);
  const totalViews    = myEvents.reduce((s, e) => s + (e.views || 0), 0);

  return ApiResponse.success(res, {
    totalRevenue, ticketsSold, totalViews,
    attendees: orders.length, revenueByDay,
    ticketBreakdown: [],
    eventCheckIns: myEvents.map(e => ({
      title: e.title,
      rate: e.totalSold ? Math.round(((e.checkedIn || 0) / e.totalSold) * 100) : 0,
    })),
  });
}));

// ───────────────────────────────────────────────────────────────────────
// ticket.routes.js
// ───────────────────────────────────────────────────────────────────────
const ticketRouter = express.Router();
const Ticket = require('../models/Ticket.model');

ticketRouter.use(protect);

ticketRouter.get('/my-tickets', asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ attendee: req.user._id })
    .sort({ createdAt: -1 })
    .populate('event', 'title slug bannerImage startDate endDate venue format organiser')
    .populate('order', 'orderId totalAmount status');
  return ApiResponse.success(res, tickets);
}));

ticketRouter.get('/:ticketId', asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
    .populate('event', 'title startDate venue format organiser bannerImage')
    .populate('order');
  if (!ticket) return ApiResponse.error(res, 'Ticket not found', 404);
  if (ticket.attendee.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }
  return ApiResponse.success(res, ticket);
}));

module.exports = { reviewRouter, wishlistRouter, couponRouter, userRouter, ticketRouter };
