const User = require('../models/User');
const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Enrollment = require('../models/Enrollment');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const CourseRegistration = require('../models/CourseRegistration');

// GET /api/admin/dashboard/stats — aggregated counts across every already-
// built module, plus the most recent enrollments/registrations for a quick
// activity feed. Revenue is derived from paid Enrollments (course price at
// the time of the enrolled cohort) since there's no separate Payment model.
const getStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalCohorts,
      activeEnrollments,
      pendingModules,
      pendingLessons,
      newRegistrations,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      Cohort.countDocuments(),
      Enrollment.countDocuments({ status: 'active' }),
      Module.countDocuments({ status: 'pending' }),
      Lesson.countDocuments({ status: 'pending' }),
      CourseRegistration.countDocuments({ status: 'new' }),
    ]);

    const paidEnrollments = await Enrollment.find({ payment_status: 'paid' })
      .populate({ path: 'cohort_id', select: 'course_id', populate: { path: 'course_id', select: 'price' } });
    const totalRevenue = paidEnrollments.reduce((sum, e) => sum + (e.cohort_id?.course_id?.price || 0), 0);

    const recentEnrollments = await Enrollment.find()
      .sort({ enrolled_at: -1 })
      .limit(5)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    const recentRegistrations = await CourseRegistration.find()
      .sort({ submitted_at: -1 })
      .limit(5)
      .populate('course_id', 'title');

    res.json({
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalCohorts,
      activeEnrollments,
      pendingApprovals: pendingModules + pendingLessons,
      newRegistrations,
      totalRevenue,
      recentEnrollments,
      recentRegistrations,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard stats', error: err.message });
  }
};

module.exports = { getStats };
