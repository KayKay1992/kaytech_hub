const mongoose = require('mongoose');

const mentorshipProgramSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true, trim: true },
  schedule_info: { type: String, default: '' },
  image_url: { type: String, default: '' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('MentorshipProgram', mentorshipProgramSchema);
