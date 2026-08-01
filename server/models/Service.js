const mongoose = require('mongoose');

const SERVICE_CATEGORIES = ['web-development', 'consultation', 'branding', 'marketing', 'ai-integration'];

const processStepSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: SERVICE_CATEGORIES, required: true },
  description: { type: String, required: true },
  // Fuller pitch shown only on the detail page — separate from the short
  // `description` used on the card, which stays compact.
  detailed_description: { type: String, default: '' },
  image_url: { type: String, default: '' },
  // Extra detail-page-only images, alongside the card's image_url. Capped
  // at 3 in the admin controller, not enforced at the schema level.
  gallery_images: { type: [String], default: [] },
  features: { type: [String], default: [] },
  process_steps: { type: [processStepSchema], default: [] },
  starting_price: { type: Number, default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Service', serviceSchema);
module.exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
