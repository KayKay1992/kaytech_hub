const express = require('express');
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  getCourseContent,
  listCohorts,
  getCohort,
  createCohort,
  updateCohort,
  listPendingModules,
  listPendingLessons,
  reviewModule,
  reviewLesson,
  deleteModule,
  deleteLesson,
  listRegistrations,
  updateRegistration,
  convertRegistration,
  listEnrollments,
  createEnrollment,
  updateEnrollment,
} = require('../controllers/adminAcademyController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/academy/courses', listCourses);
router.post('/academy/courses', imageUploadMiddleware.single('image'), createCourse);
router.get('/academy/courses/:id', getCourse);
router.patch('/academy/courses/:id', imageUploadMiddleware.single('image'), updateCourse);
router.get('/academy/courses/:id/content', getCourseContent);

router.get('/academy/cohorts', listCohorts);
router.post('/academy/cohorts', createCohort);
router.get('/academy/cohorts/:id', getCohort);
router.patch('/academy/cohorts/:id', updateCohort);

router.get('/academy/approvals/modules', listPendingModules);
router.get('/academy/approvals/lessons', listPendingLessons);
router.patch('/academy/approvals/modules/:id', reviewModule);
router.patch('/academy/approvals/lessons/:id', reviewLesson);

router.delete('/academy/modules/:id', deleteModule);
router.delete('/academy/lessons/:id', deleteLesson);

router.get('/academy/registrations', listRegistrations);
router.patch('/academy/registrations/:id', updateRegistration);
router.patch('/academy/registrations/:id/convert', convertRegistration);

router.get('/academy/enrollments', listEnrollments);
router.post('/academy/enrollments', createEnrollment);
router.patch('/academy/enrollments/:id', updateEnrollment);

module.exports = router;
