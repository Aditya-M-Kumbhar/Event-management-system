/**
 * Ticket Model — Individual ticket issued per attendee per event
 */
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId:    { type: String, unique: true, required: true }, // ES-YYYYMMDD-XXXXX
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  event:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attendee:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
  ticketType:  { type: String, required: true },
  ticketTypeName: { type: String, required: true },
  price:       { type: Number, required: true },
  currency:    { type: String, default: 'INR' },
  qrCode:      { type: String, required: true },    // base64 QR image
  qrCodeData:  { type: String, required: true },    // raw QR payload (JSON string)
  isCheckedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isTransferred: { type: Boolean, default: false },
  isRefunded:    { type: Boolean, default: false },
  attendeeInfo: {
    name:  { type: String },
    email: { type: String },
    phone: { type: String },
  },
}, { timestamps: true });

ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ event: 1, isCheckedIn: 1 });
ticketSchema.index({ attendee: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
