const mongoose = require('mongoose');

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'];

const graduateJobListingSchema = new mongoose.Schema({
  company_name: { type: String, required: true, trim: true },
  company_logo_url: { type: String, default: '' },
  job_title: { type: String, required: true, trim: true },
  job_description: { type: String, required: true },
  location: { type: String, required: true, trim: true },
  employment_type: { type: String, enum: EMPLOYMENT_TYPES, required: true },
  how_to_apply: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, {
  timestamps: { createdAt: 'posted_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('GraduateJobListing', graduateJobListingSchema);
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
