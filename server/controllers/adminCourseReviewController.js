const CourseReview = require('../models/CourseReview');
const { recalcCourseRating } = require('../utils/courseRating');
const { logAction } = require('../utils/auditLog');

const STATUSES = ['pending', 'approved', 'rejected'];

// GET /api/admin/course-reviews — every review regardless of status
const listReviews = async (req, res) => {
  try {
    const reviews = await CourseReview.find()
      .populate('student_id', 'name email')
      .populate('course_id', 'title')
      .sort({ created_at: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load course reviews', error: err.message });
  }
};

// PATCH /api/admin/course-reviews/:id — approve or reject
const updateReview = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    const review = await CourseReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Course review not found' });
    }

    review.status = status;
    if (status === 'approved' && !review.published_at) {
      review.published_at = new Date();
    }
    await review.save();
    await recalcCourseRating(review.course_id);

    if (status === 'approved' || status === 'rejected') {
      await logAction({
        actor_id: req.user._id,
        action_type: status === 'approved' ? 'course_review.approved' : 'course_review.rejected',
        target_type: 'CourseReview',
        target_id: review._id,
        details: `${status === 'approved' ? 'Approved' : 'Rejected'} a course review`,
      });
    }

    res.json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update course review', error: err.message });
  }
};

module.exports = { listReviews, updateReview };
