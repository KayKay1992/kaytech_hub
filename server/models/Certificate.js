const mongoose = require('mongoose');

// One placeholder completion certificate per student per cohort — generated
// by admin once an Enrollment is marked "completed". PDF itself is a simple
// placeholder (name, course, date) until template design work after launch.
const certificateSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  issued_at: { type: Date, default: Date.now },
  certificate_url: { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

certificateSchema.index({ student_id: 1, cohort_id: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
