const express = require('express');
const { listMyNotifications, markNotificationRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listMyNotifications);
router.post('/:id/read', markNotificationRead);

module.exports = router;
