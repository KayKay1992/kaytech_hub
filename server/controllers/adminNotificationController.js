const Notification = require('../models/Notification');
const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');

const TARGET_TYPES = ['all', 'all_students', 'all_instructors', 'all_alumni', 'specific_user'];
const CONTACT_STATUSES = ['new', 'read', 'responded'];

// POST /api/admin/notifications — admin only
const createNotification = async (req, res) => {
  try {
    const { title, message, target_type, target_user_id } = req.body;

    if (!title || !message || !target_type) {
      return res.status(400).json({ message: 'Title, message, and target_type are required' });
    }
    if (!TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({ message: `target_type must be one of: ${TARGET_TYPES.join(', ')}` });
    }
    if (target_type === 'specific_user') {
      if (!target_user_id) {
        return res.status(400).json({ message: 'target_user_id is required when target_type is specific_user' });
      }
      const targetUser = await User.findById(target_user_id);
      if (!targetUser) {
        return res.status(404).json({ message: 'Target user not found' });
      }
    }

    const notification = await Notification.create({
      sender_id: req.user._id,
      title,
      message,
      target_type,
      target_user_id: target_type === 'specific_user' ? target_user_id : null,
    });

    res.status(201).json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send notification', error: err.message });
  }
};

// GET /api/admin/notifications — admin only, full send history (any admin's)
const listSentNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ created_at: -1 })
      .populate('sender_id', 'name')
      .populate('target_user_id', 'name email');
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notifications', error: err.message });
  }
};

// GET /api/admin/contact-messages — admin only, the inbox
const listContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ submitted_at: -1 })
      .populate('sender_id', 'name email role');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load contact messages', error: err.message });
  }
};

// PATCH /api/admin/contact-messages/:id — admin only
const updateContactMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!CONTACT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${CONTACT_STATUSES.join(', ')}` });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contactMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ contactMessage });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update message status', error: err.message });
  }
};

module.exports = { createNotification, listSentNotifications, listContactMessages, updateContactMessageStatus };
