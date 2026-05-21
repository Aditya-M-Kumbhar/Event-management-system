const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  ticketTypeId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  ticketTypeName: { type: String, required: true },
  price:          { type: Number, required: true },
  quantity:       { type: Number, required: true, min: 1 },
  subtotal:       { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderId:  { type: String, unique: true, required: true }, // ORD-YYYYMMDD-XXXXX
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
  event:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  items:    { type: [orderItemSchema], required: true },
  tickets:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],

  // Pricing
  subtotal:       { type: Number, required: true },
  taxRate:        { type: Number, default: 18 },       // GST %
  taxAmount:      { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode:     { type: String, default: '' },
  totalAmount:    { type: Number, required: true },
  currency:       { type: String, default: 'INR' },

  // Status
  status: {
    type: String,
    enum: ['pending','confirmed','cancelled','refund_requested','refunded'],
    default: 'pending',
    index: true,
  },
  payment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  // Attendee details at time of booking
  attendeeSnapshot: {
    name:  String,
    email: String,
    phone: String,
  },

  // Refund
  refundReason:      { type: String },
  refundRequestedAt: { type: Date },
  refundProcessedAt: { type: Date },
}, { timestamps: true });

orderSchema.index({ orderId: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
