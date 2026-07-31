const mongoose = require('mongoose');

// A running ledger of what an instructor is owed vs. what they've actually
// been paid for a cohort. Unlike a recomputed snapshot, this only ever
// changes via discrete events, logged in `transactions`:
//   - 'accrual': a student Payment gets marked "paid" -> unpaid_amount grows
//     by payment.amount x cohort.instructor_payout_percent. Never touches
//     paid_amount.
//   - 'payout': admin pays the instructor offline -> the current
//     unpaid_amount moves onto paid_amount and resets to 0. Never touches
//     money already recorded as paid.
const instructorPayoutSchema = new mongoose.Schema({
  instructor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  unpaid_amount: { type: Number, required: true, min: 0, default: 0 },
  paid_amount: { type: Number, required: true, min: 0, default: 0 },
  // The percent in effect the last time unpaid_amount changed — kept for
  // record-keeping since a cohort's percent can be adjusted over time.
  payout_percent_used: { type: Number, default: 35 },
  last_paid_at: { type: Date, default: null },
  transactions: [{
    type: { type: String, enum: ['accrual', 'payout'], required: true },
    amount: { type: Number, required: true },
    percent_used: { type: Number }, // accrual only
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }, // accrual only
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // accrual only
    created_at: { type: Date, default: Date.now },
  }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

instructorPayoutSchema.index({ cohort_id: 1 }, { unique: true });

module.exports = mongoose.model('InstructorPayout', instructorPayoutSchema);
