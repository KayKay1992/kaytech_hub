const CourseReview = require('../models/CourseReview');
const Certificate = require('../models/Certificate');
const Cohort = require('../models/Cohort');
const { recalcCourseRating } = require('../utils/courseRating');

// GET /api/student/course-reviews — the caller's own reviews (any status),
// so the Certificates page can show "Write a Review" vs "Edit Review".
const listMyReviews = async (req, res) => {
  try {
    const reviews = await CourseReview.find({ student_id: req.user._id })
      .populate('course_id', 'title')
      .sort({ created_at: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your reviews', error: err.message });
  }
};

// POST /api/student/course-reviews — create or edit (upsert, one per
// student per course) a review. Only students holding a Certificate for a
// cohort of this course are eligible; cohort_id is derived from that
// certificate, never trusted from the client.
const submitReview = async (req, res) => {
  try {
    const { course_id, rating, review_text } = req.body;

    if (!course_id || !review_text || !review_text.trim()) {
      return res.status(400).json({ message: 'course_id and review_text are required' });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    const cohorts = await Cohort.find({ course_id }).select('_id');
    const certificate = await Certificate.findOne({
      student_id: req.user._id,
      cohort_id: { $in: cohorts.map((c) => c._id) },
    });
    if (!certificate) {
      return res.status(403).json({ message: 'Only students who have completed this course can leave a review' });
    }

    let review = await CourseReview.findOne({ student_id: req.user._id, course_id });
    if (review) {
      review.rating = ratingNum;
      review.review_text = review_text.trim();
      review.cohort_id = certificate.cohort_id;
      // Edited content needs re-approval before it's shown publicly again;
      // clear published_at so a later re-approval sets it to the real date
      // rather than keeping the stale one from before the edit.
      review.status = 'pending';
      review.published_at = null;
      await review.save();
      // The previous version of this review may have been approved and
      // counted in the cached average — re-editing pulls it back to
      // pending, so the course's rating needs to reflect that immediately.
      await recalcCourseRating(course_id);
    } else {
      review = await CourseReview.create({
        student_id: req.user._id,
        course_id,
        cohort_id: certificate.cohort_id,
        rating: ratingNum,
        review_text: review_text.trim(),
      });
    }

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit review', error: err.message });
  }
};

module.exports = { listMyReviews, submitReview };
