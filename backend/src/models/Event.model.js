/**
 * Event Model — EventSphere
 * Full event schema with tickets, agenda, speakers, FAQs, analytics
 */

const mongoose = require('mongoose');
const slugify  = require('slugify');

// ── Sub-schemas ────────────────────────────────────────────────────────────────
const ticketTypeSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['free','paid','vip','early_bird','general'], default: 'general' },
  price:       { type: Number, required: true, min: 0 },
  currency:    { type: String, default: 'INR' },
  capacity:    { type: Number, required: true, min: 1 },
  sold:        { type: Number, default: 0 },
  saleStartDate: { type: Date },
  saleEndDate:   { type: Date },
  earlyBirdExpiry: { type: Date },
  perksIncluded: { type: [String], default: [] },
  maxPerUser:    { type: Number, default: 5 },
  isActive:      { type: Boolean, default: true },
}, { _id: true });

const agendaItemSchema = new mongoose.Schema({
  time:        { type: String, required: true },   // "10:00 AM"
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  speaker:     { type: String, default: '' },
  duration:    { type: Number, default: 30 },       // minutes
  type:        { type: String, enum: ['session','break','keynote','workshop','panel'], default: 'session' },
}, { _id: true });

const speakerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  bio:        { type: String, default: '' },
  avatar:     { type: String, default: '' },
  designation:{ type: String, default: '' },
  company:    { type: String, default: '' },
  linkedin:   { type: String, default: '' },
  twitter:    { type: String, default: '' },
}, { _id: true });

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true },
}, { _id: true });

// ── Main Event Schema ──────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema({
  // ── Core Info ───────────────────────────────────────────────────────────────
  title:       { type: String, required: [true,'Title required'], trim: true, maxlength: 120 },
  slug:        { type: String, unique: true, index: true },
  description: { type: String, required: true, maxlength: 5000 },
  shortDescription: { type: String, maxlength: 250 },
  category:    {
    type: String,
    enum: ['Technology','Business','Music','Arts & Culture','Sports & Fitness',
           'Health & Wellness','Food & Drink','Education','Networking','Gaming',
           'Film & Media','Fashion','Travel','Social','Other'],
    required: true,
  },
  tags:        { type: [String], default: [] },
  bannerImage: { type: String, default: '' },
  galleryImages: { type: [String], default: [] },

  // ── Organiser ────────────────────────────────────────────────────────────────
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ── Date & Time ──────────────────────────────────────────────────────────────
  startDate:   { type: Date, required: true, index: true },
  endDate:     { type: Date, required: true },
  timezone:    { type: String, default: 'Asia/Kolkata' },
  registrationDeadline: { type: Date },

  // ── Location ─────────────────────────────────────────────────────────────────
  format:      { type: String, enum: ['online','offline','hybrid'], required: true },
  venue: {
    name:      { type: String, default: '' },
    address:   { type: String, default: '' },
    city:      { type: String, default: '', index: true },
    state:     { type: String, default: '' },
    country:   { type: String, default: 'India' },
    pincode:   { type: String, default: '' },
    lat:       { type: Number },
    lng:       { type: Number },
    mapLink:   { type: String, default: '' },
  },
  onlineMeetingLink: { type: String, default: '' },
  onlinePlatform:    { type: String, default: '' },   // Zoom, Google Meet, etc.

  // ── Capacity ──────────────────────────────────────────────────────────────────
  totalCapacity: { type: Number, required: true, min: 1 },
  totalSold:     { type: Number, default: 0 },

  // ── Tickets ───────────────────────────────────────────────────────────────────
  ticketTypes:  { type: [ticketTypeSchema], default: [] },
  isFree:       { type: Boolean, default: false },

  // ── Content ───────────────────────────────────────────────────────────────────
  agenda:   { type: [agendaItemSchema], default: [] },
  speakers: { type: [speakerSchema],   default: [] },
  faqs:     { type: [faqSchema],       default: [] },

  // ── Status & Visibility ────────────────────────────────────────────────────────
  status:      { type: String, enum: ['draft','published','cancelled','completed'], default: 'draft', index: true },
  isPublic:    { type: Boolean, default: true },
  isFeatured:  { type: Boolean, default: false },
  isTrending:  { type: Boolean, default: false },

  // ── Social & SEO ──────────────────────────────────────────────────────────────
  socialLinks: {
    website:   { type: String, default: '' },
    twitter:   { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook:  { type: String, default: '' },
  },
  metaDescription: { type: String, default: '' },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  views:         { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  totalRevenue:  { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:   { type: Number, default: 0 },

  // ── Coupon Support ────────────────────────────────────────────────────────────
  coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],

  // ── Cancellation ─────────────────────────────────────────────────────────────
  cancellationPolicy: { type: String, default: '' },
  refundPolicy:       { type: String, enum: ['no_refund','partial','full'], default: 'no_refund' },
}, {
  timestamps: true,
  toJSON:  { virtuals: true },
  toObject: { virtuals: true },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ 'venue.city': 1, status: 1 });
eventSchema.index({ isFeatured: 1, status: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ createdAt: -1 });

// ── Virtuals ──────────────────────────────────────────────────────────────────
eventSchema.virtual('availableCapacity').get(function () {
  return Math.max(0, this.totalCapacity - this.totalSold);
});

eventSchema.virtual('isSoldOut').get(function () {
  return this.totalSold >= this.totalCapacity;
});

eventSchema.virtual('isUpcoming').get(function () {
  return this.startDate > new Date();
});

eventSchema.virtual('isPast').get(function () {
  return this.endDate < new Date();
});

eventSchema.virtual('minPrice').get(function () {
  if (!this.ticketTypes?.length) return 0;
  const prices = this.ticketTypes.filter(t => t.isActive).map(t => t.price);
  return Math.min(...prices);
});

// ── Pre-save: Generate slug ───────────────────────────────────────────────────
eventSchema.pre('save', async function (next) {
  if (!this.isModified('title') && this.slug) return next();
  let baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug     = baseSlug;
  let counter  = 1;
  while (await mongoose.model('Event').findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  this.slug = slug;

  // Auto-set isFree
  this.isFree = this.ticketTypes.every(t => t.price === 0);
  next();
});

module.exports = mongoose.model('Event', eventSchema);
