const express = require('express');
const { listOpenGraduateJobs } = require('../controllers/graduateJobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listOpenGraduateJobs);

module.exports = router;
