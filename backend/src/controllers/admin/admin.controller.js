/**
 * Admin Controller — Platform Management, Analytics, Moderation
 */

const User    = require('../../models/User.model');
const Event   = require('../../models/Event.model');
const Order   = require('../../models/Order.model');
const { Payment, Review } = require('../../models/schemas');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');

// ─── Platform Statistics ──────────────────────────────────────────────────────
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsers, totalEvents, publishedEvents,
    totalOrders, totalRevenue, revenueByDay, usersByRole,
    topEvents, recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'published' }),
    Order.countDocuments({ status: 'confirmed' }),
    Order.aggregate([{ $match: { status: 'confirmed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Event.find({ status: 'published' }).sort({ totalRevenue: -1 }).limit(5).select('title totalRevenue totalSold organiser').populate('organiser', 'name'),
    Order.find({ status: 'confirmed' }).sort({ createdAt: -1 }).limit(10).populate('user', 'name email').populate('event', 'title'),
  ]);

  return ApiResponse.success(res, {
    users: {
      total:    totalUsers,
      newThisMonth: newUsers,
      byRole:   usersByRole,
    },
    events: {
      total:     totalEvents,
      published: publishedEvents,
    },
    revenue: {
      total:     totalRevenue[0]?.total || 0,
      byDay:     revenueByDay,
    },
    orders: { total: totalOrders },
    topEvents,
    recentOrders,
  });
});

// ─── User Management ──────────────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search, banned } = req.query;

  const filter = {};
  if (role)   filter.role = role;
  if (banned !== undefined) filter.isBanned = banned === 'true';
  if (search) filter.$or = [
    { name:  new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') },
  ];

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    User.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, users, getPaginationMeta(total, page, limit));
});

exports.banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return ApiResponse.error(res, 'User not found', 404);
  if (user.role === 'admin') return ApiResponse.error(res, 'Cannot ban an admin', 403);

  user.isBanned  = !user.isBanned;
  user.banReason = user.isBanned ? (reason || 'Violated platform policies') : '';
  await user.save();

  return ApiResponse.success(res, { isBanned: user.isBanned },
    user.isBanned ? 'User banned' : 'User unbanned');
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin','organiser','attendee'].includes(role)) {
    return ApiResponse.error(res, 'Invalid role', 400);
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return ApiResponse.error(res, 'User not found', 404);
  return ApiResponse.success(res, user.toSafeObject(), 'Role updated');
});

// ─── Event Moderation ──────────────────────────────────────────────────────────
exports.getAllEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate('organiser', 'name email'),
    Event.countDocuments(filter),
  ]);
  return ApiResponse.paginated(res, events, getPaginationMeta(total, page, limit));
});

exports.toggleEventVisibility = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);
  event.isPublic = !event.isPublic;
  await event.save();
  return ApiResponse.success(res, { isPublic: event.isPublic }, `Event ${event.isPublic ? 'made public' : 'hidden'}`);
});

exports.featureEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);
  event.isFeatured = !event.isFeatured;
  await event.save();
  return ApiResponse.success(res, { isFeatured: event.isFeatured }, `Event ${event.isFeatured ? 'featured' : 'unfeatured'}`);
});

exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);
  return ApiResponse.success(res, {}, 'Event deleted by admin');
});

// ─── Review Moderation ─────────────────────────────────────────────────────────
exports.deleteReview = asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  return ApiResponse.success(res, {}, 'Review removed');
});

// ─── Refund Management ─────────────────────────────────────────────────────────
exports.getPendingRefunds = asyncHandler(async (req, res) => {
  const refunds = await Order.find({ status: 'refund_requested' })
    .sort({ refundRequestedAt: 1 })
    .populate('user', 'name email')
    .populate('event', 'title');
  return ApiResponse.success(res, refunds);
});
