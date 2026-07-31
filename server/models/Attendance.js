const mongoose = require('mongoose');

// One record per student per cohort per class date — marked by the
// instructor after each physical session (not weekly).
const attendanceSchema = new mongoose.Schema({
  cohort_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

attendanceSchema.index({ cohort_id: 1, student_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
