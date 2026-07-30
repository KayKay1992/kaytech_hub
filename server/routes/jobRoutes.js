const express = require('express');
const { listOpenJobs, getJob, applyToJob } = require('../controllers/jobController');
const { fileUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.get('/', listOpenJobs);
router.get('/:id', getJob);
router.post('/:id/apply', fileUploadMiddleware.single('resume'), applyToJob);

module.exports = router;
