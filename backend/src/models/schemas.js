const mongoose = require('mongoose');

// ─── Payment Model ────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  order:             { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  razorpayOrderId:   { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, sparse: true },
  razorpaySignature: { type: String },
  amount:            { type: Number, required: true },
  currency:          { type: String, default: 'INR' },
  status:            { type: String, enum: ['pending','success','failed','refunded'], default: 'pending', index: true },
  method:            { type: String, default: '' },    // upi, card, netbanking…
  refundId:          { type: String },
  refundAmount:      { type: Number },
  refundedAt:        { type: Date },
  metadata:          { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

// ─── Review Model ─────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  event:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  order:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  title:     { type: String, maxlength: 100 },
  body:      { type: String, maxlength: 1000 },
  isPublic:  { type: Boolean, default: true },
  helpful:   { type: Number, default: 0 },
  images:    { type: [String], default: [] },
}, { timestamps: true });

reviewSchema.index({ event: 1, user: 1 }, { unique: true });  // one review per attendee per event
reviewSchema.index({ event: 1, rating: -1 });

// Post-save: update event averageRating & reviewCount
reviewSchema.post('save', async function () {
  const Event = mongoose.model('Event');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { event: this.event } },
    { $group: { _id: '$event', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length) {
    await Event.findByIdAndUpdate(this.event, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount:   stats[0].count,
    });
  }
});

// ─── Notification Model ───────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:    {
    type: String,
    enum: ['ticket_confirmed','event_reminder','event_updated','event_cancelled',
           'refund_status','wishlist_reminder','review_request','system'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String, default: '' },    // frontend URL to navigate to
  image:   { type: String, default: '' },
  isRead:  { type: Boolean, default: false, index: true },
  metadata:{ type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// ─── Wishlist Model ───────────────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
}, { timestamps: true });

wishlistSchema.index({ user: 1, event: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

// ─── Coupon Model ─────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code:           { type: String, required: true, uppercase: true, trim: true },
  event:          { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
  organiser:      { type: mongoose.Schema.Types.ObjectId, ref: 'User'  },
  discountType:   { type: String, enum: ['percentage','fixed'], required: true },
  discountValue:  { type: Number, required: true, min: 0 },
  maxDiscount:    { type: Number },           // cap for percentage discounts
  minOrderAmount: { type: Number, default: 0 },
  maxUses:        { type: Number, default: null },  // null = unlimited
  usedCount:      { type: Number, default: 0 },
  perUserLimit:   { type: Number, default: 1 },
  validFrom:      { type: Date, required: true },
  validUntil:     { type: Date, required: true },
  isActive:       { type: Boolean, default: true },
  usedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

couponSchema.index({ code: 1, event: 1 }, { unique: true });

couponSchema.methods.isValid = function (userId, orderAmount) {
  const now = new Date();
  if (!this.isActive)             return { valid: false, reason: 'Coupon is inactive.' };
  if (now < this.validFrom)       return { valid: false, reason: 'Coupon not yet active.' };
  if (now > this.validUntil)      return { valid: false, reason: 'Coupon has expired.' };
  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, reason: 'Coupon usage limit reached.' };
  if (orderAmount < this.minOrderAmount) return { valid: false, reason: `Minimum order ₹${this.minOrderAmount} required.` };
  const userUseCount = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUseCount >= this.perUserLimit) return { valid: false, reason: 'You have already used this coupon.' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (amount) {
  if (this.discountType === 'percentage') {
    const disc = (amount * this.discountValue) / 100;
    return this.maxDiscount ? Math.min(disc, this.maxDiscount) : disc;
  }
  return Math.min(this.discountValue, amount);
};

// ─── CheckIn Model ────────────────────────────────────────────────────────────
const checkInSchema = new mongoose.Schema({
  event:   { type: mongoose.Schema.Types.ObjectId, ref: 'Event',  required: true, index: true },
  ticket:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  attendee:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method:  { type: String, enum: ['qr_scan','manual'], default: 'qr_scan' },
  device:  { type: String, default: '' },
}, { timestamps: true });

checkInSchema.index({ event: 1, ticket: 1 }, { unique: true });

// ─── Session Model (for AI schedule builder) ─────────────────────────────────
const sessionSchema = new mongoose.Schema({
  event:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title:    { type: String, required: true },
  speaker:  { type: String },
  duration: { type: Number, required: true },  // minutes
  type:     { type: String, enum: ['session','break','keynote','workshop','panel'] },
  startTime:{ type: String },
  endTime:  { type: String },
  room:     { type: String },
  tags:     { type: [String], default: [] },
  aiGenerated: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Payment:      mongoose.model('Payment',      paymentSchema),
  Review:       mongoose.model('Review',       reviewSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Wishlist:     mongoose.model('Wishlist',     wishlistSchema),
  Coupon:       mongoose.model('Coupon',       couponSchema),
  CheckIn:      mongoose.model('CheckIn',      checkInSchema),
  Session:      mongoose.model('Session',      sessionSchema),
};
