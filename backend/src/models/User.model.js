/**
 * User Model — EventSphere
 * Supports local auth + Google OAuth, roles, profile, wishlist references
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String, required: [true, 'Name is required'],
      trim: true, minlength: 2, maxlength: 60,
    },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum:    ['admin', 'organiser', 'attendee'],
      default: 'attendee',
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    avatar:    { type: String, default: '' },
    bio:       { type: String, maxlength: 300, default: '' },
    phone:     { type: String, default: '' },
    city:      { type: String, default: '' },
    website:   { type: String, default: '' },
    linkedin:  { type: String, default: '' },
    twitter:   { type: String, default: '' },

    // ── Interests (for AI recommendations) ───────────────────────────────────
    interests:    { type: [String], default: [] },
    searchHistory:{ type: [String], default: [], select: false },

    // ── Auth ──────────────────────────────────────────────────────────────────
    googleId:        { type: String, sparse: true },
    authProvider:    { type: String, enum: ['local', 'google'], default: 'local' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken:{ type: String, select: false },

    // ── Password Reset ────────────────────────────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ── Account Status ────────────────────────────────────────────────────────
    isBanned:  { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    lastLogin: { type: Date },

    // ── Organiser Details ─────────────────────────────────────────────────────
    organisationName:    { type: String, default: '' },
    organisationWebsite: { type: String, default: '' },
    isOrganiserVerified: { type: Boolean, default: false },

    // ── Notification Preferences ──────────────────────────────────────────────
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      marketing:      { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON:    { virtuals: true },
    toObject:  { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtual: Full profile URL ────────────────────────────────────────────────
userSchema.virtual('profileUrl').get(function () {
  return `/users/${this._id}`;
});

// ─── Pre-save: Hash password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken  = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return resetToken;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerifyToken;
  delete obj.searchHistory;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
