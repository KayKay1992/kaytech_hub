const mongoose = require('mongoose');

const mentorshipRegistrationSchema = new mongoose.Schema({
  program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipProgram', required: true },
  full_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  occupation_or_status: { type: String, required: true, trim: true },
  experience_level: { type: String, required: true, trim: true },
  reason_for_joining: { type: String, required: true },
  how_heard_about_us: { type: String, default: '' },
  payment_status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  status: { type: String, enum: ['registered', 'attending', 'completed'], default: 'registered' },
}, {
  timestamps: { createdAt: 'registered_at', updatedAt: false },
});

module.exports = mongoose.model('MentorshipRegistration', mentorshipRegistrationSchema);
