const express = require('express');
const { getHistory, sendMessage } = require('../controllers/assistantController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('student', 'instructor'));

router.get('/history', getHistory);
router.post('/chat', sendMessage);

module.exports = router;
