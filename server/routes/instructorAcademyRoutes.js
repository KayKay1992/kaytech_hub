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
  listMyCohorts,
  listCohortAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentSubmissions,
  gradeSubmission,
  getAttendanceRoster,
  saveAttendance,
  getAttendanceHistory,
  listMyPayouts,
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

router.get('/cohorts', listMyCohorts);
router.get('/cohorts/:cohortId/assignments', listCohortAssignments);

router.post('/assignments', createAssignment);
router.patch('/assignments/:id', updateAssignment);
router.delete('/assignments/:id', deleteAssignment);
router.get('/assignments/:id/submissions', listAssignmentSubmissions);

router.patch('/submissions/:id/grade', gradeSubmission);

router.get('/cohorts/:cohortId/attendance/roster', getAttendanceRoster);
router.get('/cohorts/:cohortId/attendance/history', getAttendanceHistory);
router.post('/cohorts/:cohortId/attendance', saveAttendance);

router.get('/payouts', listMyPayouts);

module.exports = router;
