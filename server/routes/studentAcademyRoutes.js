const express = require('express');
const { listMyCourses, getCohortContent, toggleLessonComplete } = require('../controllers/studentAcademyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/courses', listMyCourses);
router.get('/cohorts/:cohortId/content', getCohortContent);
router.post('/cohorts/:cohortId/lessons/:lessonId/complete', toggleLessonComplete);

module.exports = router;
