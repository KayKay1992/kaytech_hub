const mongoose = require('mongoose');

// Offline payment ledger for Academy enrollments — one record per
// student/cohort pair, created automatically when an Enrollment is made.
// Admin marks it paid manually after receiving money via bank transfer/cash.
const paymentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  amount: { type: Number, required: true, min: 0 },
  amount_paid: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  payment_method: { type: String, enum: ['bank_transfer', 'cash', 'other', ''], default: '' },
  reference_note: { type: String, default: '' },
  paid_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

paymentSchema.index({ student_id: 1, cohort_id: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
