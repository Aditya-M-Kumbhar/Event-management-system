/**
 * Event Controller — Create, Read, Update, Delete, Analytics
 */

const Event       = require('../../models/Event.model');
const { Wishlist } = require('../../models/schemas');
const ApiResponse  = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const cloudinaryService = require('../../services/storage/cloudinary.service');

// ─── Helper: Parse FormData fields that arrive as JSON strings ─────────────
const parseFormDataFields = (body) => {
  const jsonFields = ['venue', 'ticketTypes', 'agenda', 'speakers', 'faqs', 'tags', 'socialLinks'];
  jsonFields.forEach((field) => {
    if (typeof body[field] === 'string') {
      try { body[field] = JSON.parse(body[field]); } catch { /* leave as-is */ }
    }
  });

  // Coerce numeric fields
  if (body.totalCapacity) body.totalCapacity = Number(body.totalCapacity) || 1;

  return body;
};

// ─── Create Event ─────────────────────────────────────────────────────────────
exports.createEvent = asyncHandler(async (req, res) => {
  // Parse JSON strings that come from multipart/form-data
  parseFormDataFields(req.body);

  const eventData = { ...req.body, organiser: req.user._id };

  // Upload banner if provided
  if (req.file) {
    const result = await cloudinaryService.uploadImage(req.file.buffer, 'event-banners');
    eventData.bannerImage = result.secure_url;
  }

  const event = await Event.create(eventData);
  return ApiResponse.created(res, event, 'Event created successfully');
});

// ─── Get All Events (Discovery) ───────────────────────────────────────────────
exports.getEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const {
    category, city, format, type, sort,
    dateFrom, dateTo, search, featured, trending,
  } = req.query;

  // Build filter
  const filter = { status: 'published', isPublic: true };

  if (category) filter.category = category;
  if (city)     filter['venue.city'] = new RegExp(city, 'i');
  if (format)   filter.format = format;
  if (type === 'free')  filter.isFree = true;
  if (type === 'paid')  filter.isFree = false;
  if (featured === 'true') filter.isFeatured = true;
  if (trending === 'true') filter.isTrending = true;

  if (dateFrom || dateTo) {
    filter.startDate = {};
    if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
    if (dateTo)   filter.startDate.$lte = new Date(dateTo);
  } else {
    // Default: upcoming events only
    filter.startDate = { $gte: new Date() };
  }

  // Text search
  if (search) {
    filter.$text = { $search: search };
  }

  // Sort options
  const sortMap = {
    newest:    { createdAt: -1 },
    popular:   { views: -1 },
    trending:  { wishlistCount: -1, views: -1 },
    price_asc: { minPrice: 1 },
    price_desc:{ minPrice: -1 },
    date_asc:  { startDate: 1 },
    date_desc: { startDate: -1 },
  };
  const sortOption = sortMap[sort] || { startDate: 1 };

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select('-agenda -faqs -coupons')
      .populate('organiser', 'name avatar organisationName'),
    Event.countDocuments(filter),
  ]);

  // Increment view counts asynchronously
  const ids = events.map(e => e._id);
  Event.updateMany({ _id: { $in: ids } }, { $inc: { views: 1 } }).exec();

  return ApiResponse.paginated(
    res, events,
    getPaginationMeta(total, page, limit)
  );
});

// ─── Get Single Event by Slug ─────────────────────────────────────────────────
exports.getEventBySlug = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug, status: 'published' })
    .populate('organiser', 'name avatar bio organisationName organisationWebsite')
    .populate('coupons', 'code discountType discountValue validUntil');

  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  // Track view
  event.views += 1;
  await event.save({ validateBeforeSave: false });

  // Check if user has wishlisted
  let isWishlisted = false;
  if (req.user) {
    const wishlist = await Wishlist.findOne({ user: req.user._id, event: event._id });
    isWishlisted = !!wishlist;
  }

  return ApiResponse.success(res, { event, isWishlisted });
});

// ─── Get Event by ID ──────────────────────────────────────────────────────────
exports.getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organiser', 'name avatar organisationName');
  if (!event) return ApiResponse.error(res, 'Event not found', 404);
  return ApiResponse.success(res, event);
});

// ─── Update Event ─────────────────────────────────────────────────────────────
exports.updateEvent = asyncHandler(async (req, res) => {
  // Parse JSON strings that come from multipart/form-data
  parseFormDataFields(req.body);

  const event = await Event.findById(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized to update this event', 403);
  }

  if (req.file) {
    // Delete old banner
    if (event.bannerImage) await cloudinaryService.deleteImage(event.bannerImage);
    const result = await cloudinaryService.uploadImage(req.file.buffer, 'event-banners');
    req.body.bannerImage = result.secure_url;
  }

  const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });

  return ApiResponse.success(res, updated, 'Event updated successfully');
});

// ─── Delete Event ─────────────────────────────────────────────────────────────
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  if (event.totalSold > 0) {
    // Soft-cancel instead of hard delete if tickets sold
    event.status = 'cancelled';
    await event.save();
    return ApiResponse.success(res, {}, 'Event cancelled (tickets were sold)');
  }

  if (event.bannerImage) await cloudinaryService.deleteImage(event.bannerImage);
  await event.deleteOne();
  return ApiResponse.success(res, {}, 'Event deleted successfully');
});

// ─── Publish / Unpublish Event ────────────────────────────────────────────────
exports.publishEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  if (event.organiser.toString() !== req.user._id.toString()) {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  // Validate required fields before publishing
  const required = ['title','description','category','startDate','endDate','totalCapacity'];
  const missing  = required.filter(f => !event[f]);
  if (missing.length) {
    return ApiResponse.error(res, `Missing fields: ${missing.join(', ')}`, 400);
  }
  if (!event.ticketTypes.length) {
    return ApiResponse.error(res, 'At least one ticket type is required', 400);
  }

  event.status = event.status === 'published' ? 'draft' : 'published';
  await event.save();

  return ApiResponse.success(res, { status: event.status },
    `Event ${event.status === 'published' ? 'published' : 'unpublished'} successfully`);
});

// ─── Get Organiser's Own Events ───────────────────────────────────────────────
exports.getMyEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { organiser: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  return ApiResponse.paginated(res, events, getPaginationMeta(total, page, limit));
});

// ─── Event Analytics (Organiser) ──────────────────────────────────────────────
exports.getEventAnalytics = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return ApiResponse.error(res, 'Event not found', 404);

  if (event.organiser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return ApiResponse.error(res, 'Not authorized', 403);
  }

  const Order  = require('../../models/Order.model');
  const Ticket = require('../../models/Ticket.model');

  const [orders, tickets, checkedIn] = await Promise.all([
    Order.find({ event: event._id, status: 'confirmed' }),
    Ticket.countDocuments({ event: event._id }),
    Ticket.countDocuments({ event: event._id, isCheckedIn: true }),
  ]);

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const revenueByDay  = await Order.aggregate([
    { $match: { event: event._id, status: 'confirmed', createdAt: { $gte: thirtyDaysAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$totalAmount' },
      orders:  { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  // Ticket type breakdown
  const ticketBreakdown = await Order.aggregate([
    { $match: { event: event._id, status: 'confirmed' } },
    { $unwind: '$items' },
    { $group: {
      _id:      '$items.ticketTypeName',
      quantity: { $sum: '$items.quantity' },
      revenue:  { $sum: '$items.subtotal' },
    }},
  ]);

  return ApiResponse.success(res, {
    totalRevenue:    event.totalRevenue,
    totalSold:       event.totalSold,
    totalCapacity:   event.totalCapacity,
    checkedIn,
    checkInRate:     event.totalSold ? Math.round((checkedIn / event.totalSold) * 100) : 0,
    views:           event.views,
    wishlistCount:   event.wishlistCount,
    averageRating:   event.averageRating,
    reviewCount:     event.reviewCount,
    revenueByDay,
    ticketBreakdown,
    totalOrders: orders.length,
  });
});

// ─── Featured Events ──────────────────────────────────────────────────────────
exports.getFeaturedEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({
    status: 'published', isFeatured: true, startDate: { $gte: new Date() },
  })
    .sort({ startDate: 1 })
    .limit(8)
    .populate('organiser', 'name avatar');
  return ApiResponse.success(res, events);
});

// ─── Trending Events ──────────────────────────────────────────────────────────
exports.getTrendingEvents = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const events = await Event.find({
    status: 'published',
    startDate: { $gte: new Date() },
    updatedAt: { $gte: sevenDaysAgo },
  })
    .sort({ views: -1, wishlistCount: -1 })
    .limit(8)
    .select('-agenda -faqs')
    .populate('organiser', 'name avatar');
  return ApiResponse.success(res, events);
});
