const express = require('express');
const {
  listAllJobs,
  getJob,
  createJob,
  updateJob,
  listApplicationsForJob,
  updateApplicationStatus,
  getApplicationResumeUrl,
} = require('../controllers/adminJobController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/jobs', listAllJobs);
router.post('/jobs', createJob);
router.get('/jobs/:id', getJob);
router.patch('/jobs/:id', updateJob);
router.get('/jobs/:id/applications', listApplicationsForJob);

router.patch('/applications/:id', updateApplicationStatus);
router.get('/applications/:id/resume-url', getApplicationResumeUrl);

module.exports = router;
