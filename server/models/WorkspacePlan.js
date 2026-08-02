const mongoose = require('mongoose');

const DURATIONS = ['day', 'week', 'month', 'year'];

const workspacePlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  duration: { type: String, enum: DURATIONS, required: true },
  price: { type: Number, required: true, min: 0 },
  perks: { type: [String], default: [] },
  image_url: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('WorkspacePlan', workspacePlanSchema);
module.exports.DURATIONS = DURATIONS;
