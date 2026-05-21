const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  event:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  title:       { type: String, required: true },
  speaker:     { type: String, default: '' },
  duration:    { type: Number, required: true },
  type:        { type: String, enum: ['session','break','keynote','workshop','panel','networking'], default: 'session' },
  startTime:   { type: String, default: '' },
  endTime:     { type: String, default: '' },
  room:        { type: String, default: '' },
  tags:        { type: [String], default: [] },
  description: { type: String, default: '' },
  aiGenerated: { type: Boolean, default: false },
  orderIndex:  { type: Number, default: 0 },
}, { timestamps: true });

sessionSchema.index({ event: 1, orderIndex: 1 });

module.exports = mongoose.model('Session', sessionSchema);
