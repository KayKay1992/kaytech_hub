const mongoose = require('mongoose');

// Modules belong to a Course (shared across all of that course's cohorts),
// created by an instructor assigned to at least one cohort of the course.
// Goes through the admin approval workflow before students can see it.
const moduleSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejection_reason: {
    type: String,
    default: '',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Module', moduleSchema);
