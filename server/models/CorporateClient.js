const mongoose = require('mongoose');

const CLIENT_STATUSES = ['active', 'inactive'];

const corporateClientSchema = new mongoose.Schema({
  company_name: { type: String, required: true, trim: true },
  contact_person_name: { type: String, required: true, trim: true },
  contact_email: { type: String, required: true, trim: true, lowercase: true },
  contact_phone: { type: String, required: true, trim: true },
  source_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CorporateTrainingRequest', default: null },
  status: { type: String, enum: CLIENT_STATUSES, default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('CorporateClient', corporateClientSchema);
module.exports.CLIENT_STATUSES = CLIENT_STATUSES;
