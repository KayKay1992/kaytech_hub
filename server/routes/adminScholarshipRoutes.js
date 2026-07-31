const express = require('express');
const {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  listApplicationsForProgram,
  updateApplication,
} = require('../controllers/adminScholarshipController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/scholarships', listPrograms);
router.post('/scholarships', imageUploadMiddleware.single('image'), createProgram);
router.get('/scholarships/:id', getProgram);
router.patch('/scholarships/:id', imageUploadMiddleware.single('image'), updateProgram);
router.get('/scholarships/:id/applications', listApplicationsForProgram);

router.patch('/scholarships/applications/:id', updateApplication);

module.exports = router;
