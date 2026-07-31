const mongoose = require('mongoose');

const scholarshipApplicationSchema = new mongoose.Schema({
  scholarship_program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ScholarshipProgram', required: true },
  applicant_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  // The course the applicant is asking the scholarship to fund — distinct
  // from assigned_course_id, which admin sets on approval and may differ.
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  assigned_course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: false },
});

module.exports = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);
