const express = require('express');
const { listOpenJobs, getJob, applyToJob } = require('../controllers/jobController');
const { fileUploadMiddleware } = require('../utils/upload');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listOpenJobs);
router.get('/:id', getJob);
router.post('/:id/apply', standardFormLimiter, fileUploadMiddleware.single('resume'), checkHoneypot(), applyToJob);

module.exports = router;
