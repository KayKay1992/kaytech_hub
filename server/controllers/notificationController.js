const Notification = require('../models/Notification');
const NotificationRead = require('../models/NotificationRead');

// GET /api/notifications — any authenticated user. Includes broadcasts to
// "all", broadcasts to their role (students/instructors), and anything
// targeted at them specifically.
const listMyNotifications = async (req, res) => {
  try {
    const conditions = [
      { target_type: 'all' },
      { target_type: 'specific_user', target_user_id: req.user._id },
    ];
    if (req.user.role === 'student') conditions.push({ target_type: 'all_students' });
    if (req.user.role === 'instructor') conditions.push({ target_type: 'all_instructors' });

    const notifications = await Notification.find({ $or: conditions })
      .sort({ created_at: -1 })
      .populate('sender_id', 'name');

    const reads = await NotificationRead.find({
      user_id: req.user._id,
      notification_id: { $in: notifications.map((n) => n._id) },
    });
    const readIds = new Set(reads.map((r) => r.notification_id.toString()));

    const withReadState = notifications.map((n) => {
      const obj = n.toObject();
      obj.is_read = readIds.has(n._id.toString());
      return obj;
    });

    res.json({ notifications: withReadState });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications', error: err.message });
  }
};

// POST /api/notifications/:id/read — any authenticated user, only for
// notifications actually addressed to them.
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const targetsMe =
      notification.target_type === 'all' ||
      (notification.target_type === 'all_students' && req.user.role === 'student') ||
      (notification.target_type === 'all_instructors' && req.user.role === 'instructor') ||
      (notification.target_type === 'specific_user' && String(notification.target_user_id) === String(req.user._id));

    if (!targetsMe) {
      return res.status(403).json({ message: 'This notification is not addressed to you' });
    }

    await NotificationRead.updateOne(
      { notification_id: notification._id, user_id: req.user._id },
      { $setOnInsert: { notification_id: notification._id, user_id: req.user._id } },
      { upsert: true }
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
  }
};

module.exports = { listMyNotifications, markNotificationRead };
