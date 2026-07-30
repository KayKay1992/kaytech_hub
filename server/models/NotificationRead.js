const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema({
  notification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: 'read_at', updatedAt: false },
});

// A user can only read a given notification once.
notificationReadSchema.index({ notification_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);
