const mongoose = require('mongoose');

const scholarshipProgramSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: { type: String, default: '' },
  image_url: { type: String, default: '' },
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  // When true, this scholarship isn't tied to a single course — it applies to
  // every course, including ones created later. course_id stays null in that
  // case rather than snapshotting the course list at creation time.
  applies_to_all_courses: { type: Boolean, default: false },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('ScholarshipProgram', scholarshipProgramSchema);
