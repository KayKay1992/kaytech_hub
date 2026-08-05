const express = require('express');
const { exportRevenueCSV, exportPayoutsCSV } = require('../controllers/adminReportsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/reports/export/revenue', exportRevenueCSV);
router.get('/reports/export/payouts', exportPayoutsCSV);

module.exports = router;
