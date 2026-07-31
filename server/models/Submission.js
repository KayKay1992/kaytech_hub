const mongoose = require('mongoose');

// One submission per student per assignment — resubmitting replaces the
// file and clears any previous grade, since the old score no longer
// applies to the new file.
const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file_url: { type: String, required: true },
  // Set explicitly (not via `timestamps`) so it advances on every
  // resubmission, not just the first.
  submitted_at: { type: Date, default: Date.now },
  score: { type: Number, default: null, min: 0 },
  feedback: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

submissionSchema.index({ assignment_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
