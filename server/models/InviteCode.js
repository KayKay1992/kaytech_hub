const mongoose = require('mongoose');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['student', 'instructor'],
    required: true,
  },
  status: {
    type: String,
    enum: ['unused', 'used'],
    default: 'unused',
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  used_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  used_at: {
    type: Date,
    default: null,
  },
  expires_at: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + SEVEN_DAYS_MS),
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('InviteCode', inviteCodeSchema);
