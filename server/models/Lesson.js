const mongoose = require('mongoose');

// A resource is either an instructor-provided link or an uploaded file —
// both render the same way (label + url) to students.
const resourceSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['link', 'file'], required: true },
}, { _id: false });

// Lessons live under a Module. No video anywhere in this app — content is
// notes (PDF), resources (links/files), and a coding exercise (text/markdown).
const lessonSchema = new mongoose.Schema({
  module_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  notes_file_url: {
    type: String,
    default: '',
  },
  resources: {
    type: [resourceSchema],
    default: [],
  },
  coding_exercise: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejection_reason: {
    type: String,
    default: '',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Lesson', lessonSchema);
