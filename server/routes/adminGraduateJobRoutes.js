const express = require('express');
const {
  listGraduateJobs,
  getGraduateJob,
  createGraduateJob,
  updateGraduateJob,
  deleteGraduateJob,
} = require('../controllers/adminGraduateJobController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/graduate-jobs', listGraduateJobs);
router.post('/graduate-jobs', imageUploadMiddleware.single('image'), createGraduateJob);
router.get('/graduate-jobs/:id', getGraduateJob);
router.patch('/graduate-jobs/:id', imageUploadMiddleware.single('image'), updateGraduateJob);
router.delete('/graduate-jobs/:id', deleteGraduateJob);

module.exports = router;
