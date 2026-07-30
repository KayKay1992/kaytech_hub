const express = require('express');
const {
  listMyCourses,
  getCourseContent,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} = require('../controllers/instructorAcademyController');
const { protect, authorize } = require('../middleware/auth');
const { fileUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('instructor'));

router.get('/courses', listMyCourses);
router.get('/courses/:courseId/content', getCourseContent);

router.post('/modules', createModule);
router.patch('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);

const lessonUpload = fileUploadMiddleware.fields([
  { name: 'notes_file', maxCount: 1 },
  { name: 'resource_files', maxCount: 10 },
]);

router.post('/lessons', lessonUpload, createLesson);
router.patch('/lessons/:id', lessonUpload, updateLesson);
router.delete('/lessons/:id', deleteLesson);

module.exports = router;
