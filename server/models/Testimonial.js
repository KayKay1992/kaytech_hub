const mongoose = require('mongoose');

// Public submission — anyone (student, client, mentee, workspace member,
// visitor) can leave one, no login required. `submitted_by_user_id` is only
// set when the submitter happened to be logged in. Hidden from public view
// until admin approves it; `featured` controls Home page display.
const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role_or_organization: { type: String, trim: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: null },
  photo_url: { type: String, default: '' },
  submitted_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  featured: { type: Boolean, default: false },
  // Set automatically the moment admin approves — distinct from
  // submitted_at, which is when it was first submitted.
  published_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: false },
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
