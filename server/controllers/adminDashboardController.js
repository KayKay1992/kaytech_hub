const User = require('../models/User');
const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Enrollment = require('../models/Enrollment');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const CourseRegistration = require('../models/CourseRegistration');
const Payment = require('../models/Payment');
const ScholarshipProgram = require('../models/ScholarshipProgram');
const ServicePayment = require('../models/ServicePayment');
const MentorshipPayment = require('../models/MentorshipPayment');
const MentorshipRegistration = require('../models/MentorshipRegistration');
const WorkspacePayment = require('../models/WorkspacePayment');
const WorkspaceSubscription = require('../models/WorkspaceSubscription');

// Sums an `amount` field across every document in a collection — used for
// the three revenue streams (Services/Mentorship/Space) that have no
// pending/paid status of their own: every row that exists is already-
// collected money.
const sumAmount = async (Model) => {
  const [{ total } = { total: 0 }] = await Model.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return total;
};

// GET /api/admin/dashboard/stats — aggregated counts across every module
// (Academy, Hub, Space, Scholarships), plus combined and per-business-line
// revenue, plus the most recent enrollments/registrations for a quick
// activity feed. "Revenue" always means money actually collected, not what's
// still owed — Academy Payments are matched to status: 'paid'; the other
// three revenue streams have no status field so their full sum is collected
// money by definition.
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
      activeScholarships,
      mentorshipRegistrations,
      activeWorkspaceMembers,
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
      ScholarshipProgram.countDocuments({ status: 'open' }),
      MentorshipRegistration.countDocuments(),
      WorkspaceSubscription.countDocuments({ status: 'active' }),
    ]);

    const [{ totalRevenue: academyRevenue } = { totalRevenue: 0 }] = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);

    const [servicesRevenue, mentorshipRevenue, spaceRevenue] = await Promise.all([
      sumAmount(ServicePayment),
      sumAmount(MentorshipPayment),
      sumAmount(WorkspacePayment),
    ]);

    const revenueByLine = {
      academy: academyRevenue,
      services: servicesRevenue,
      mentorship: mentorshipRevenue,
      space: spaceRevenue,
    };
    const totalRevenue = academyRevenue + servicesRevenue + mentorshipRevenue + spaceRevenue;

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
      activeScholarships,
      mentorshipRegistrations,
      activeWorkspaceMembers,
      totalRevenue,
      revenueByLine,
      recentEnrollments,
      recentRegistrations,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard stats', error: err.message });
  }
};

module.exports = { getStats };
