const express = require('express');
const { listMyReviews, submitReview } = require('../controllers/studentCourseReviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/course-reviews', listMyReviews);
router.post('/course-reviews', submitReview);

module.exports = router;
