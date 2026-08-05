const mongoose = require('mongoose');

// A student who holds a Certificate for a course may leave ONE review for
// it — enforced by the compound unique index below. Editing an existing
// review reuses the same document (see studentCourseReviewController)
// rather than creating a duplicate. Hidden from public view until admin
// approves it, same pattern as SuccessStory/Testimonial.
const courseReviewSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  // The specific completed cohort that made the student eligible — derived
  // server-side from their Certificate, never trusted from the client.
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  // Set automatically the moment admin approves — distinct from
  // created_at, which is when the student first submitted it.
  published_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

courseReviewSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model('CourseReview', courseReviewSchema);
