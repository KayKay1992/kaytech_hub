const mongoose = require('mongoose');

const TRAINING_TYPES = ['staff_training', 'ai_training', 'software_training', 'other'];
const PIPELINE_STAGES = ['new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost'];

const corporateTrainingRequestSchema = new mongoose.Schema({
  company_name: { type: String, required: true, trim: true },
  contact_person_name: { type: String, required: true, trim: true },
  contact_email: { type: String, required: true, trim: true, lowercase: true },
  contact_phone: { type: String, required: true, trim: true },
  training_type: { type: String, enum: TRAINING_TYPES, required: true },
  number_of_participants: { type: Number, default: null },
  preferred_timeline: { type: String, default: '' },
  message: { type: String, required: true },
  stage: { type: String, enum: PIPELINE_STAGES, default: 'new' },
  notes: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('CorporateTrainingRequest', corporateTrainingRequestSchema);
module.exports.TRAINING_TYPES = TRAINING_TYPES;
module.exports.PIPELINE_STAGES = PIPELINE_STAGES;
