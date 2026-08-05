const mongoose = require('mongoose');

// Captured when someone tries to register interest for a Cohort that's
// already at max_students capacity. Admin can later notify everyone here
// once a new cohort for the same course opens, and convert entries into
// real Enrollments the same way a CourseRegistration is converted.
const cohortWaitlistEntrySchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  // The cohort that was full when they joined — not necessarily the one
  // they eventually get enrolled in.
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  // 'notified' is set in bulk by the admin "Notify Waitlist" action once a
  // new cohort opens; 'converted' once admin turns the entry into a real
  // Enrollment.
  status: { type: String, enum: ['waiting', 'notified', 'converted'], default: 'waiting' },
}, {
  timestamps: { createdAt: 'joined_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('CohortWaitlistEntry', cohortWaitlistEntrySchema);
