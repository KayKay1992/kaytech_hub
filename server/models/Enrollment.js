const mongoose = require('mongoose');

// Formal enrollment — links a student account to a specific Cohort. Distinct
// from CourseRegistration (public interest form, no login yet, no cohort
// placement) — admin creates this once the registrant has a real student
// account (via invite code) and a cohort has been assigned.
const enrollmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
  payment_status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  // Approved lessons the student has checked off — powers the "My Courses"
  // completion progress bar. No separate Assignment/Attendance model exists
  // yet, so this is the only progress signal available today.
  completed_lesson_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
}, {
  timestamps: { createdAt: 'enrolled_at', updatedAt: 'updated_at' },
});

enrollmentSchema.index({ student_id: 1, cohort_id: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
