const mongoose = require('mongoose');

const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];

// Multiple payments can belong to the same MentorshipRegistration
// (installments) — no one-payment-per-registration restriction.
const mentorshipPaymentSchema = new mongoose.Schema({
  mentorship_registration_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRegistration', required: true },
  amount: { type: Number, required: true, min: 0 },
  payment_method: { type: String, enum: PAYMENT_METHODS, required: true },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

mentorshipPaymentSchema.index({ mentorship_registration_id: 1 });

module.exports = mongoose.model('MentorshipPayment', mentorshipPaymentSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
