const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  company_name: { type: String, trim: true, default: '' },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'contacted', 'in-progress', 'completed'], default: 'new' },
}, {
  timestamps: { createdAt: 'submitted_at', updatedAt: false },
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
