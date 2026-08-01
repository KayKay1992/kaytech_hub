const mongoose = require('mongoose');

const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];

// Multiple payments can belong to the same ServiceRequest (deposit + final
// payment, milestone billing) — no one-payment-per-request restriction.
const servicePaymentSchema = new mongoose.Schema({
  service_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  amount: { type: Number, required: true, min: 0 },
  payment_method: { type: String, enum: PAYMENT_METHODS, required: true },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

servicePaymentSchema.index({ service_request_id: 1 });

module.exports = mongoose.model('ServicePayment', servicePaymentSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
