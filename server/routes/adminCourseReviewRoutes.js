const express = require('express');
const { listReviews, updateReview } = require('../controllers/adminCourseReviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/course-reviews', listReviews);
router.patch('/course-reviews/:id', updateReview);

module.exports = router;
