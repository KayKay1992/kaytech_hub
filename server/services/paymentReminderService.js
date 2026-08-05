const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { sendPaymentReminderEmail } = require('../utils/email');

// Space automatic reminders out — don't email a student again until this
// many days have passed since their last reminder (or, if none has gone
// out yet, since their last verified payment / enrollment date).
const REMINDER_INTERVAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const populateForReminder = (query) => query
  .populate('student_id', 'name email')
  .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

const deliverReminder = async (enrollment) => {
  await sendPaymentReminderEmail(enrollment.student_id.email, {
    name: enrollment.student_id.name,
    courseTitle: enrollment.cohort_id?.course_id?.title || 'your course',
    cohortName: enrollment.cohort_id?.name || '',
    amountPaid: enrollment.amount_paid,
    balanceRemaining: enrollment.balance_remaining,
  });
  enrollment.last_reminder_sent_at = new Date();
  await enrollment.save();
};

// Run by the daily cron: finds every active enrollment with a balance
// owing and, for each one that's due (never reminded + old enough since
// enrollment, or last reminded more than REMINDER_INTERVAL_DAYS ago),
// sends a reminder. Silently skips anything not due yet — this is meant
// to run once a day and be a no-op on the days in between.
const runAutomaticReminders = async () => {
  const candidates = await populateForReminder(Enrollment.find({
    status: 'active',
    balance_remaining: { $gt: 0 },
  }));

  const now = Date.now();
  let sent = 0;
  for (const enrollment of candidates) {
    if (!enrollment.student_id?.email) continue;

    let referenceDate = enrollment.last_reminder_sent_at;
    if (!referenceDate) {
      const lastPaidInstallment = await Payment.findOne({ enrollment_id: enrollment._id, status: 'paid' }).sort({ paid_at: -1 });
      referenceDate = lastPaidInstallment?.paid_at || enrollment.enrolled_at;
    }

    const daysSinceReference = (now - new Date(referenceDate).getTime()) / MS_PER_DAY;
    if (daysSinceReference < REMINDER_INTERVAL_DAYS) continue;

    await deliverReminder(enrollment);
    sent += 1;
  }

  return { checked: candidates.length, sent };
};

// Admin-triggered "Send Reminder Now" — bypasses the interval gate (that's
// the whole point of a manual override) but still refuses to email a
// dropped enrollment or one with no balance owing.
const sendManualReminder = async (enrollmentId) => {
  const enrollment = await populateForReminder(Enrollment.findById(enrollmentId));
  if (!enrollment) {
    const err = new Error('Enrollment not found');
    err.status = 404;
    throw err;
  }
  if (enrollment.status === 'dropped') {
    const err = new Error('Cannot send a payment reminder for a dropped enrollment');
    err.status = 400;
    throw err;
  }
  if (!(enrollment.balance_remaining > 0)) {
    const err = new Error('This enrollment has no outstanding balance');
    err.status = 400;
    throw err;
  }
  if (!enrollment.student_id?.email) {
    const err = new Error('This student has no email on file');
    err.status = 400;
    throw err;
  }

  await deliverReminder(enrollment);
  return enrollment;
};

module.exports = { runAutomaticReminders, sendManualReminder, REMINDER_INTERVAL_DAYS };
