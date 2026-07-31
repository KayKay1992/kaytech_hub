const express = require('express');
const { getStats } = require('../controllers/adminDashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard/stats', getStats);

module.exports = router;
