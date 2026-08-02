const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'paid'];
// 'pending' covers the gap between reservation and admin confirming
// payment — start_date/end_date aren't known yet at that point, so
// 'active'/'expired' alone (as sketched in the spec) isn't enough states.
const SUBSCRIPTION_STATUSES = ['pending', 'active', 'expired'];

const workspaceSubscriptionSchema = new mongoose.Schema({
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspacePlan', required: true },
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  occupation_or_purpose: { type: String, required: true, trim: true },
  valid_id_type: { type: String, required: true, trim: true },
  valid_id_number: { type: String, required: true, trim: true },
  emergency_contact_name: { type: String, required: true, trim: true },
  emergency_contact_phone: { type: String, required: true, trim: true },
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  payment_status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
  status: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'pending' },
  notes: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('WorkspaceSubscription', workspaceSubscriptionSchema);
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.SUBSCRIPTION_STATUSES = SUBSCRIPTION_STATUSES;
