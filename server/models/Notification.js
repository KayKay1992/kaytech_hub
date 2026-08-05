const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  target_type: {
    type: String,
    enum: ['all', 'all_students', 'all_instructors', 'all_alumni', 'specific_user'],
    required: true,
  },
  target_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Notification', notificationSchema);
