const ContactMessage = require('../models/ContactMessage');

const TYPES = ['general', 'partnership', 'corporate'];

// POST /api/contact — public. If the sender is logged in (any role),
// optionalAuth has already attached req.user, so we link it; anonymous
// submissions are captured the same way, just without a linked account.
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, message, type } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      message,
      type: TYPES.includes(type) ? type : 'general',
      sender_id: req.user ? req.user._id : null,
    });

    res.status(201).json({ contactMessage });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

module.exports = { submitContactMessage };
