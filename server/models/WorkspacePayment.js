const mongoose = require('mongoose');

const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];

// Multiple payments can belong to the same WorkspaceSubscription
// (deposits, renewals) — no one-payment-per-subscription restriction.
const workspacePaymentSchema = new mongoose.Schema({
  workspace_subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceSubscription', required: true },
  amount: { type: Number, required: true, min: 0 },
  payment_method: { type: String, enum: PAYMENT_METHODS, required: true },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

workspacePaymentSchema.index({ workspace_subscription_id: 1 });

module.exports = mongoose.model('WorkspacePayment', workspacePaymentSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
