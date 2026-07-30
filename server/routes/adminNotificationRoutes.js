const express = require('express');
const {
  createNotification,
  listSentNotifications,
  listContactMessages,
  updateContactMessageStatus,
} = require('../controllers/adminNotificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/notifications', listSentNotifications);
router.post('/notifications', createNotification);
router.get('/contact-messages', listContactMessages);
router.patch('/contact-messages/:id', updateContactMessageStatus);

module.exports = router;
