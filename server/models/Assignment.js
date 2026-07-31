const mongoose = require('mongoose');

// Assignments are tied to a Cohort (not just a Course) since due dates and
// grading are specific to one batch of students; optionally scoped to a
// single Lesson for context.
const assignmentSchema = new mongoose.Schema({
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  lesson_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  due_date: { type: Date, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Assignment', assignmentSchema);
