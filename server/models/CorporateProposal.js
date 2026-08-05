const mongoose = require('mongoose');

const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'rejected'];

const corporateProposalSchema = new mongoose.Schema({
  request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CorporateTrainingRequest', required: true },
  title: { type: String, required: true, trim: true },
  scope_description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  valid_until: { type: Date, required: true },
  status: { type: String, enum: PROPOSAL_STATUSES, default: 'draft' },
  pdf_url: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

corporateProposalSchema.index({ request_id: 1 });

module.exports = mongoose.model('CorporateProposal', corporateProposalSchema);
module.exports.PROPOSAL_STATUSES = PROPOSAL_STATUSES;
