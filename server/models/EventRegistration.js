const mongoose = require('mongoose');

// willing_to_pay_at_event only means anything when the event's own is_paid
// is true — for free events it's just left at its default.
const eventRegistrationSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  willing_to_pay_at_event: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'registered_at', updatedAt: false },
});

eventRegistrationSchema.index({ event_id: 1 });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
