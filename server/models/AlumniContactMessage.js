const mongoose = require('mongoose');

// Audit log + rate-limit anchor for Alumni Directory "Reach Me" messages.
// Delivery itself rides the existing Notification system (target_type:
// 'specific_user') so the recipient sees it in their normal Notifications
// page — this collection just records that the contact happened.
const alumniContactMessageSchema = new mongoose.Schema({
  from_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

alumniContactMessageSchema.index({ from_user_id: 1, created_at: -1 });

module.exports = mongoose.model('AlumniContactMessage', alumniContactMessageSchema);
