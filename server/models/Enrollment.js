const mongoose = require('mongoose');

// Formal enrollment — links a student account to a specific Cohort. Distinct
// from CourseRegistration (public interest form, no login yet, no cohort
// placement) — admin creates this once the registrant has a real student
// account (via invite code) and a cohort has been assigned.
const enrollmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  // payment_status is derived (never set directly by admin) from
  // amount_paid vs. total_fee, kept in sync every time a Payment
  // installment is verified paid.
  payment_status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  // Snapshot of the course price at the time of enrollment — the total this
  // student owes for this cohort, independent of later course price changes.
  total_fee: { type: Number, default: 0, min: 0 },
  // Running total of every verified (Payment.status === 'paid') installment
  // for this enrollment.
  amount_paid: { type: Number, default: 0, min: 0 },
  // total_fee - amount_paid, kept in sync automatically alongside amount_paid.
  balance_remaining: { type: Number, default: 0, min: 0 },
  // Approved lessons the student has checked off — powers the "My Courses"
  // completion progress bar. No separate Assignment/Attendance model exists
  // yet, so this is the only progress signal available today.
  completed_lesson_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
}, {
  timestamps: { createdAt: 'enrolled_at', updatedAt: 'updated_at' },
});

enrollmentSchema.index({ student_id: 1, cohort_id: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
