const mongoose = require('mongoose');

// Submitted by a student from their dashboard once they've completed a
// cohort (gated on holding a Certificate). Hidden from public view until
// admin approves it; `featured` controls Home page display separately from
// approval, so all approved stories can populate a fuller list later.
const successStorySchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  headline: { type: String, required: true, trim: true },
  story: { type: String, required: true },
  photo_url: { type: String, default: '' },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  featured: { type: Boolean, default: false },
  // Set automatically the moment admin approves — distinct from
  // submitted_at, which is when the student first sent it in.
  published_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: false },
});

module.exports = mongoose.model('SuccessStory', successStorySchema);
