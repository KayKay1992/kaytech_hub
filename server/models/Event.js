const mongoose = require('mongoose');

const EVENT_TYPES = ['seminar', 'workshop', 'hackathon', 'career_fair'];

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  type: { type: String, enum: EVENT_TYPES, required: true },
  image_url: { type: String, default: '' },
  is_paid: { type: Boolean, default: false },
  // Only meaningful when is_paid is true — kept null otherwise rather than 0,
  // so "no price set" and "free" can't be confused.
  price: { type: Number, default: null },
  // null means no capacity limit — spots-remaining logic treats it as unlimited.
  max_participants: { type: Number, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Event', eventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
