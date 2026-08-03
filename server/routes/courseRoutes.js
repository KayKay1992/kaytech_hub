const express = require('express');
const { listPublishedCourses, getCourse, registerForCourse } = require('../controllers/courseController');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listPublishedCourses);
router.get('/:id', getCourse);
router.post('/:id/register', standardFormLimiter, checkHoneypot(), registerForCourse);

module.exports = router;
