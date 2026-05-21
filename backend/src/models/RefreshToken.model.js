/**
 * RefreshToken Model — optional DB-backed token blacklist
 * Used when you need to explicitly revoke refresh tokens
 */
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date,   required: true },
  isRevoked: { type: Boolean, default: false },
  createdByIp: { type: String },
  userAgent:   { type: String },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

refreshTokenSchema.methods.isExpired = function () {
  return new Date() >= this.expiresAt;
};

refreshTokenSchema.methods.isActive = function () {
  return !this.isRevoked && !this.isExpired();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
