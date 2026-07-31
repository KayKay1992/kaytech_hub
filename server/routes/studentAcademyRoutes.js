const express = require('express');
const {
  listMyCourses,
  getCohortContent,
  toggleLessonComplete,
  listMyAssignments,
  submitAssignment,
  getMyAttendance,
} = require('../controllers/studentAcademyController');
const { protect, authorize } = require('../middleware/auth');
const { fileUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/courses', listMyCourses);
router.get('/cohorts/:cohortId/content', getCohortContent);
router.post('/cohorts/:cohortId/lessons/:lessonId/complete', toggleLessonComplete);

router.get('/assignments', listMyAssignments);
router.post('/assignments/:id/submit', fileUploadMiddleware.single('file'), submitAssignment);

router.get('/cohorts/:cohortId/attendance', getMyAttendance);

module.exports = router;
