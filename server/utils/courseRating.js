const mongoose = require('mongoose');
const Course = require('../models/Course');
const CourseReview = require('../models/CourseReview');

// Recalculates and caches a course's average rating + review count from its
// approved reviews. Called any time a review's status changes (admin
// approve/reject) so Course stays in sync without a live aggregate query on
// every course-card render.
async function recalcCourseRating(course_id) {
  const [stats] = await CourseReview.aggregate([
    { $match: { course_id: new mongoose.Types.ObjectId(course_id), status: 'approved' } },
    { $group: { _id: '$course_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Course.findByIdAndUpdate(course_id, {
    average_rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    review_count: stats ? stats.count : 0,
  });
}

module.exports = { recalcCourseRating };
