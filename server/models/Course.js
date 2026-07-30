const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    trim: true,
    default: '',
  },
  duration: {
    type: String,
    trim: true,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  requirements: {
    type: String,
    default: '',
  },
  curriculum: {
    type: String,
    default: '',
  },
  image_url: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Course', courseSchema);
