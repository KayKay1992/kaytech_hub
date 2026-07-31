const mongoose = require('mongoose');

// A course "runs" as one or more cohorts (batches) — each with its own
// instructor, schedule, and per-student payout rate.
const cohortSchema = new mongoose.Schema({
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },
  // Share of each verified student payment that goes to the instructor —
  // applied per-payment as it's marked paid, not a flat per-head rate.
  instructor_payout_percent: {
    type: Number,
    default: 35,
    min: 0,
    max: 100,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Cohort', cohortSchema);
