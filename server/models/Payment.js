const mongoose = require('mongoose');

// One installment toward an Enrollment's total_fee — students often pay in
// multiple installments, so many Payment records can belong to the same
// enrollment (no one-payment-per-enrollment restriction). Each installment
// is either not yet collected ("pending") or fully collected and verified
// by admin ("paid") — there's no partial state on an individual
// installment; a part-payment is just its own smaller installment record.
const paymentSchema = new mongoose.Schema({
  enrollment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  payment_method: { type: String, enum: ['bank_transfer', 'cash', 'other', ''], default: '' },
  reference_note: { type: String, default: '' },
  paid_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

paymentSchema.index({ enrollment_id: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
