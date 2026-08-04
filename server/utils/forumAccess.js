const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

const BAN_MESSAGES = {
  student: "You've been restricted from the Student Forum by an admin.",
  alumni: "You've been restricted from the Alumni Forum by an admin.",
};
const QUALIFY_MESSAGES = {
  student: 'This forum is for currently enrolled students — enroll in a cohort to gain access.',
  alumni: 'This forum is for KayTech Hub alumni — complete a course to gain access.',
};
const ROLE_MESSAGE = 'This forum is for KayTech Hub students and alumni only.';

// Computes live Student/Alumni Forum access for a user — never cached, since
// Enrollment/Certificate state (and admin bans) can change at any time.
const getForumAccess = async (user) => {
  if (['instructor', 'admin'].includes(user.role)) {
    return {
      student: { allowed: true, message: null },
      alumni: { allowed: true, message: null },
    };
  }

  if (user.role !== 'student') {
    return {
      student: { allowed: false, message: ROLE_MESSAGE },
      alumni: { allowed: false, message: ROLE_MESSAGE },
    };
  }

  const [activeEnrollments, certificates] = await Promise.all([
    Enrollment.find({ student_id: user._id, status: 'active' }, 'cohort_id'),
    Certificate.find({ student_id: user._id }, 'cohort_id'),
  ]);

  const certifiedCohortIds = new Set(certificates.map((c) => String(c.cohort_id)));
  const hasUncertifiedActiveEnrollment = activeEnrollments.some(
    (e) => !certifiedCohortIds.has(String(e.cohort_id))
  );
  const hasAnyCertificate = certificates.length > 0;

  const studentQualifies = hasUncertifiedActiveEnrollment;
  const alumniQualifies = hasAnyCertificate;

  return {
    student: {
      allowed: studentQualifies && !user.forum_ban_student,
      message: user.forum_ban_student
        ? BAN_MESSAGES.student
        : studentQualifies
          ? null
          : QUALIFY_MESSAGES.student,
    },
    alumni: {
      allowed: alumniQualifies && !user.forum_ban_alumni,
      message: user.forum_ban_alumni
        ? BAN_MESSAGES.alumni
        : alumniQualifies
          ? null
          : QUALIFY_MESSAGES.alumni,
    },
  };
};

module.exports = { getForumAccess };
