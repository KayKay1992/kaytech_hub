const express = require('express');
const { listPublishedCourses, getCourse, registerForCourse } = require('../controllers/courseController');

const router = express.Router();

router.get('/', listPublishedCourses);
router.get('/:id', getCourse);
router.post('/:id/register', registerForCourse);

module.exports = router;
