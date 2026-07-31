const mongoose = require('mongoose');

// Public, no-login "interest" registration for a course — same pattern as
// Hub's Mentorship registration. This is NOT the same as Enrollment (which
// links a logged-in student account to a specific Cohort); admin follows up
// with these offline and moves confirmed registrants through signup +
// Enrollment separately.
const courseRegistrationSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  cohort_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort',
  },
  full_name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  occupation_status: {
    type: String,
    required: true,
    trim: true,
  },
  experience_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  how_heard: {
    type: String,
    default: '',
    trim: true,
  },
  // Offline payment — starts pending, admin flips to paid after receiving
  // money via bank transfer/cash. No payment gateway.
  payment_status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  // 'converted' is set automatically once admin creates the matching
  // Enrollment from this registration — not meant to be picked by hand.
  status: {
    type: String,
    enum: ['new', 'contacted', 'confirmed', 'declined', 'converted'],
    default: 'new',
  },
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('CourseRegistration', courseRegistrationSchema);
