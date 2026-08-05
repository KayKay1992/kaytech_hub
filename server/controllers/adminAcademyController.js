const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const CourseRegistration = require('../models/CourseRegistration');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const InstructorPayout = require('../models/InstructorPayout');
const Certificate = require('../models/Certificate');
const CohortWaitlistEntry = require('../models/CohortWaitlistEntry');
const { uploadImage, uploadFile, deleteFile, keyFromUrl } = require('../utils/upload');
const { buildCertificatePdf } = require('../utils/certificatePdf');
const { sendPaymentConfirmedEmail, sendEnrollmentWelcomeEmail, sendCohortWaitlistOpenEmail } = require('../utils/email');

const COURSE_STATUSES = ['draft', 'published', 'archived'];
const COHORT_STATUSES = ['upcoming', 'active', 'completed'];
const REVIEW_ACTIONS = ['approve', 'reject'];
const REGISTRATION_STATUSES = ['new', 'contacted', 'confirmed', 'declined', 'converted'];
const PAYMENT_STATUSES = ['pending', 'paid'];
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];
const ENROLLMENT_STATUSES = ['active', 'completed', 'dropped'];
const DEFAULT_PAYOUT_PERCENT = 35;

// Snapshots the cohort's course price onto a freshly-created Enrollment as
// total_fee, and zeroes out the running amount_paid/balance_remaining
// ledger. Used by both createEnrollment and convertRegistration, the two
// places an Enrollment gets created. If the caller declared the enrollment
// already fully paid (e.g. cash collected before this system was used),
// records that as one verified installment so it flows through the exact
// same ledger/payout logic as any other payment — never a special case.
const initializeEnrollmentFee = async (enrollment, { alreadyPaid = false } = {}) => {
  const cohort = await Cohort.findById(enrollment.cohort_id).populate('course_id', 'price');
  const total_fee = cohort?.course_id?.price || 0;

  enrollment.total_fee = total_fee;
  enrollment.amount_paid = 0;
  enrollment.balance_remaining = total_fee;
  enrollment.payment_status = 'pending';
  await enrollment.save();

  if (alreadyPaid && total_fee > 0 && cohort) {
    const payment = await Payment.create({
      enrollment_id: enrollment._id,
      student_id: enrollment.student_id,
      cohort_id: enrollment.cohort_id,
      amount: total_fee,
      status: 'paid',
      payment_method: 'other',
      reference_note: 'Recorded as already paid at enrollment',
      paid_at: new Date(),
    });
    await applyVerifiedPaymentToEnrollment(payment, enrollment);
    await recordPayoutAccrual(payment);
  }
};

// Adds a verified installment's amount onto its enrollment's running
// amount_paid, recalculates balance_remaining, and re-derives
// payment_status from the two — this is the only thing that ever moves
// those numbers, so they can't drift out of sync with actual Payment
// records.
const applyVerifiedPaymentToEnrollment = async (payment, preloadedEnrollment) => {
  const enrollment = preloadedEnrollment || await Enrollment.findById(payment.enrollment_id);
  if (!enrollment) return;

  enrollment.amount_paid = (enrollment.amount_paid || 0) + payment.amount;
  enrollment.balance_remaining = Math.max(0, (enrollment.total_fee || 0) - enrollment.amount_paid);
  enrollment.payment_status = enrollment.balance_remaining <= 0 && enrollment.amount_paid > 0
    ? 'paid'
    : (enrollment.amount_paid > 0 ? 'partial' : 'pending');

  await enrollment.save();
};

// Ensures every cohort has an InstructorPayout ledger row, even ones with
// no accruals yet, so admin/instructor views can list all cohorts at ₦0
// rather than only ones a payment has touched. Never recomputes existing
// unpaid_amount/paid_amount — those only change via recordPayoutAccrual and
// payInstructor.
const ensurePayoutForCohort = async (cohort) => {
  const existing = await InstructorPayout.findOne({ cohort_id: cohort._id });
  if (existing) {
    // Keep instructor_id in sync in case the cohort's instructor changed.
    if (String(existing.instructor_id) !== String(cohort.instructor_id)) {
      existing.instructor_id = cohort.instructor_id;
      await existing.save();
    }
    return existing;
  }
  return InstructorPayout.create({
    instructor_id: cohort.instructor_id,
    cohort_id: cohort._id,
    unpaid_amount: 0,
    paid_amount: 0,
    payout_percent_used: cohort.instructor_payout_percent ?? DEFAULT_PAYOUT_PERCENT,
  });
};

// The core event hook: called whenever a student Payment transitions into
// "paid". Adds payment.amount x cohort.instructor_payout_percent onto that
// instructor+cohort's unpaid_amount and logs an accrual transaction — never
// touches paid_amount. Safe to call multiple times only because callers
// guard it to fire on the pending/partial -> paid transition, not on every
// save of an already-paid record.
const recordPayoutAccrual = async (payment) => {
  const cohort = await Cohort.findById(payment.cohort_id);
  if (!cohort) {
    console.error(`recordPayoutAccrual: no cohort found for payment ${payment._id} (cohort_id=${payment.cohort_id}) — payout ledger NOT updated`);
    return;
  }

  const percent = cohort.instructor_payout_percent ?? DEFAULT_PAYOUT_PERCENT;
  const payoutAmount = Math.round(payment.amount * (percent / 100));

  const payout = await ensurePayoutForCohort(cohort);
  payout.unpaid_amount += payoutAmount;
  payout.payout_percent_used = percent;
  payout.transactions.push({
    type: 'accrual',
    amount: payoutAmount,
    percent_used: percent,
    payment_id: payment._id,
    student_id: payment.student_id,
    created_at: new Date(),
  });
  await payout.save();
};

// Nests lessons under their module — shared by the admin and instructor
// "course content" tree views.
const buildModuleTree = async (courseId) => {
  const modules = await Module.find({ course_id: courseId }).sort({ order: 1, created_at: 1 });
  const lessons = await Lesson.find({ module_id: { $in: modules.map((m) => m._id) } }).sort({ order: 1, created_at: 1 });

  return modules.map((mod) => ({
    ...mod.toObject(),
    lessons: lessons.filter((lesson) => String(lesson.module_id) === String(mod._id)),
  }));
};

// ---------- Courses ----------

// GET /api/admin/academy/courses — every course regardless of status
const listCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ created_at: -1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load courses', error: err.message });
  }
};

// GET /api/admin/academy/courses/:id
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load course', error: err.message });
  }
};

// POST /api/admin/academy/courses — optional cover image (field: image)
const createCourse = async (req, res) => {
  try {
    const { title, description, category, duration, price, requirements, curriculum, status } = req.body;
    if (!title || !description || price === undefined || price === '') {
      return res.status(400).json({ message: 'Title, description, and price are required' });
    }
    if (status && !COURSE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${COURSE_STATUSES.join(', ')}` });
    }

    let image_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'course-images');
      image_url = result.url;
    }

    const course = await Course.create({
      title,
      description,
      category,
      duration,
      price: Number(price),
      requirements,
      curriculum,
      image_url,
      status: status || 'draft',
    });

    res.status(201).json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create course', error: err.message });
  }
};

// PATCH /api/admin/academy/courses/:id — edit, change status (incl. archive), replace image
const updateCourse = async (req, res) => {
  try {
    const { title, description, category, duration, price, requirements, curriculum, status, featured } = req.body;
    if (status && !COURSE_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${COURSE_STATUSES.join(', ')}` });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (duration !== undefined) course.duration = duration;
    if (price !== undefined) course.price = Number(price);
    if (requirements !== undefined) course.requirements = requirements;
    if (curriculum !== undefined) course.curriculum = curriculum;
    if (status !== undefined) course.status = status;
    if (featured !== undefined) course.featured = featured === true || featured === 'true';

    if (req.file) {
      const oldKey = keyFromUrl(course.image_url);
      const result = await uploadImage(req.file, 'course-images');
      course.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await course.save();
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update course', error: err.message });
  }
};

// GET /api/admin/academy/courses/:id/content — full module/lesson tree, any status
const getCourseContent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const modules = await buildModuleTree(course._id);
    res.json({ course, modules });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load course content', error: err.message });
  }
};

// ---------- Cohorts ----------

// GET /api/admin/academy/cohorts?course_id=...
const listCohorts = async (req, res) => {
  try {
    const { course_id } = req.query;
    const filter = {};
    if (course_id) filter.course_id = course_id;

    const cohorts = await Cohort.find(filter)
      .populate('course_id', 'title')
      .populate('instructor_id', 'name email')
      .sort({ start_date: -1 });

    // Active (non-dropped) enrollment count per cohort, so the table can
    // show "X / Y students" and flag when a cohort is at capacity.
    const counts = await Enrollment.aggregate([
      { $match: { cohort_id: { $in: cohorts.map((c) => c._id) }, status: { $ne: 'dropped' } } },
      { $group: { _id: '$cohort_id', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const withCounts = cohorts.map((cohort) => ({
      ...cohort.toObject(),
      enrolled_count: countMap.get(String(cohort._id)) || 0,
    }));

    res.json({ cohorts: withCounts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load cohorts', error: err.message });
  }
};

// GET /api/admin/academy/cohorts/:id
const getCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id)
      .populate('course_id', 'title')
      .populate('instructor_id', 'name email');
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    res.json({ cohort });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load cohort', error: err.message });
  }
};

// POST /api/admin/academy/cohorts
const createCohort = async (req, res) => {
  try {
    const { course_id, instructor_id, name, start_date, end_date, instructor_payout_percent, status, max_students } = req.body;
    if (!course_id || !instructor_id || !name || !start_date || !end_date) {
      return res.status(400).json({ message: 'course_id, instructor_id, name, start_date, and end_date are required' });
    }
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    if (status && !COHORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${COHORT_STATUSES.join(', ')}` });
    }
    if (instructor_payout_percent !== undefined && instructor_payout_percent !== '' && (Number(instructor_payout_percent) < 0 || Number(instructor_payout_percent) > 100)) {
      return res.status(400).json({ message: 'instructor_payout_percent must be between 0 and 100' });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const instructor = await User.findOne({ _id: instructor_id, role: 'instructor' });
    if (!instructor) {
      return res.status(400).json({ message: 'instructor_id must reference a user with role "instructor"' });
    }

    const cohort = await Cohort.create({
      course_id,
      instructor_id,
      name,
      start_date,
      end_date,
      ...(instructor_payout_percent !== undefined && instructor_payout_percent !== '' ? { instructor_payout_percent: Number(instructor_payout_percent) } : {}),
      status: status || 'upcoming',
      max_students: max_students || null,
    });

    res.status(201).json({ cohort });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create cohort', error: err.message });
  }
};

// PATCH /api/admin/academy/cohorts/:id
const updateCohort = async (req, res) => {
  try {
    const { instructor_id, name, start_date, end_date, instructor_payout_percent, status, max_students } = req.body;
    if (status && !COHORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${COHORT_STATUSES.join(', ')}` });
    }
    if (instructor_payout_percent !== undefined && instructor_payout_percent !== '' && (Number(instructor_payout_percent) < 0 || Number(instructor_payout_percent) > 100)) {
      return res.status(400).json({ message: 'instructor_payout_percent must be between 0 and 100' });
    }

    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    if (instructor_id !== undefined) {
      const instructor = await User.findOne({ _id: instructor_id, role: 'instructor' });
      if (!instructor) {
        return res.status(400).json({ message: 'instructor_id must reference a user with role "instructor"' });
      }
      cohort.instructor_id = instructor_id;
    }
    if (name !== undefined) cohort.name = name;
    if (start_date !== undefined) cohort.start_date = start_date;
    if (end_date !== undefined) cohort.end_date = end_date;
    if (instructor_payout_percent !== undefined && instructor_payout_percent !== '') cohort.instructor_payout_percent = Number(instructor_payout_percent);
    if (status !== undefined) cohort.status = status;
    if (max_students !== undefined) cohort.max_students = max_students || null;

    if (new Date(cohort.start_date) >= new Date(cohort.end_date)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    await cohort.save();
    res.json({ cohort });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update cohort', error: err.message });
  }
};

// ---------- Approval queue ----------

// GET /api/admin/academy/approvals/modules — all pending, across every course
const listPendingModules = async (req, res) => {
  try {
    const modules = await Module.find({ status: 'pending' })
      .populate('course_id', 'title')
      .populate('created_by', 'name email')
      .sort({ created_at: 1 });
    res.json({ modules });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load pending modules', error: err.message });
  }
};

// GET /api/admin/academy/approvals/lessons — all pending, across every course
const listPendingLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ status: 'pending' })
      .populate({
        path: 'module_id',
        select: 'title course_id',
        populate: { path: 'course_id', select: 'title' },
      })
      .populate('created_by', 'name email')
      .sort({ created_at: 1 });
    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load pending lessons', error: err.message });
  }
};

// PATCH /api/admin/academy/approvals/modules/:id — { action: 'approve'|'reject', rejection_reason? }
const reviewModule = async (req, res) => {
  try {
    const { action, rejection_reason } = req.body;
    if (!REVIEW_ACTIONS.includes(action)) {
      return res.status(400).json({ message: 'action must be "approve" or "reject"' });
    }

    const mod = await Module.findById(req.params.id);
    if (!mod) {
      return res.status(404).json({ message: 'Module not found' });
    }

    mod.status = action === 'approve' ? 'approved' : 'rejected';
    mod.rejection_reason = action === 'reject' ? (rejection_reason || '') : '';
    await mod.save();

    res.json({ module: mod });
  } catch (err) {
    res.status(500).json({ message: 'Failed to review module', error: err.message });
  }
};

// PATCH /api/admin/academy/approvals/lessons/:id — { action: 'approve'|'reject', rejection_reason? }
const reviewLesson = async (req, res) => {
  try {
    const { action, rejection_reason } = req.body;
    if (!REVIEW_ACTIONS.includes(action)) {
      return res.status(400).json({ message: 'action must be "approve" or "reject"' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    lesson.status = action === 'approve' ? 'approved' : 'rejected';
    lesson.rejection_reason = action === 'reject' ? (rejection_reason || '') : '';
    await lesson.save();

    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ message: 'Failed to review lesson', error: err.message });
  }
};

// ---------- Delete (admin can delete regardless of status) ----------

// DELETE /api/admin/academy/modules/:id — cascades to its lessons
const deleteModule = async (req, res) => {
  try {
    const mod = await Module.findByIdAndDelete(req.params.id);
    if (!mod) {
      return res.status(404).json({ message: 'Module not found' });
    }
    await Lesson.deleteMany({ module_id: mod._id });
    res.json({ message: 'Module deleted', id: mod._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete module', error: err.message });
  }
};

// DELETE /api/admin/academy/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json({ message: 'Lesson deleted', id: lesson._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete lesson', error: err.message });
  }
};

// ---------- Course registrations (offline, admin-managed) ----------

// GET /api/admin/academy/registrations?course_id=...
const listRegistrations = async (req, res) => {
  try {
    const { course_id } = req.query;
    const filter = {};
    if (course_id) filter.course_id = course_id;

    const registrations = await CourseRegistration.find(filter)
      .populate('course_id', 'title')
      .populate('cohort_id', 'name')
      .sort({ submitted_at: -1 });

    res.json({ registrations });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations', error: err.message });
  }
};

// PATCH /api/admin/academy/registrations/:id — update status and/or payment_status
const updateRegistration = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    if (status && !REGISTRATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${REGISTRATION_STATUSES.join(', ')}` });
    }
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }

    const registration = await CourseRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (status !== undefined) registration.status = status;
    if (payment_status !== undefined) registration.payment_status = payment_status;

    await registration.save();
    res.json({ registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update registration', error: err.message });
  }
};

// PATCH /api/admin/academy/registrations/:id/convert — { cohort_id }.
// Only works once the registrant already has a student account (created via
// invite code, matched by email) — this is the step that connects the public
// "interest" registration to a real Enrollment instead of the two staying
// disconnected lists.
const convertRegistration = async (req, res) => {
  try {
    const { cohort_id } = req.body;
    if (!cohort_id) {
      return res.status(400).json({ message: 'cohort_id is required' });
    }

    const registration = await CourseRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    if (registration.status === 'converted') {
      return res.status(400).json({ message: 'This registration has already been converted' });
    }

    const cohort = await Cohort.findById(cohort_id).populate('course_id', 'title');
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    const student = await User.findOne({ email: registration.email, role: 'student' });
    if (!student) {
      return res.status(400).json({ message: 'No student account found for this email yet — generate an invite code and confirm they have signed up first' });
    }

    const existing = await Enrollment.findOne({ student_id: student._id, cohort_id });
    if (existing) {
      return res.status(400).json({ message: 'This student is already enrolled in this cohort' });
    }

    const enrollment = await Enrollment.create({
      student_id: student._id,
      cohort_id,
    });
    await initializeEnrollmentFee(enrollment, { alreadyPaid: registration.payment_status === 'paid' });

    registration.status = 'converted';
    await registration.save();

    await sendEnrollmentWelcomeEmail(student.email, {
      name: student.name,
      courseTitle: cohort.course_id?.title || 'your course',
      cohortName: cohort.name,
    });

    res.status(201).json({ enrollment, registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to convert registration', error: err.message });
  }
};

// ---------- Enrollments ----------

// GET /api/admin/academy/enrollments?cohort_id=...&student_id=...
const listEnrollments = async (req, res) => {
  try {
    const { cohort_id, student_id } = req.query;
    const filter = {};
    if (cohort_id) filter.cohort_id = cohort_id;
    if (student_id) filter.student_id = student_id;

    const enrollments = await Enrollment.find(filter)
      .populate('student_id', 'name email')
      .populate({
        path: 'cohort_id',
        select: 'name course_id',
        populate: { path: 'course_id', select: 'title' },
      })
      .sort({ enrolled_at: -1 });

    // Attach each enrollment's individual installment payments (its full
    // fee/paid/balance history), newest first, for the admin payments ledger.
    const payments = await Payment.find({ enrollment_id: { $in: enrollments.map((e) => e._id) } }).sort({ created_at: -1 });
    const paymentsByEnrollmentId = new Map();
    payments.forEach((p) => {
      const key = String(p.enrollment_id);
      if (!paymentsByEnrollmentId.has(key)) paymentsByEnrollmentId.set(key, []);
      paymentsByEnrollmentId.get(key).push(p);
    });
    const withPayments = enrollments.map((e) => ({
      ...e.toObject(),
      payments: paymentsByEnrollmentId.get(String(e._id)) || [],
    }));

    res.json({ enrollments: withPayments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load enrollments', error: err.message });
  }
};

// POST /api/admin/academy/enrollments — enroll an existing student account
// into a specific cohort
const createEnrollment = async (req, res) => {
  try {
    const { student_id, cohort_id, payment_status } = req.body;
    if (!student_id || !cohort_id) {
      return res.status(400).json({ message: 'student_id and cohort_id are required' });
    }
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }

    const student = await User.findOne({ _id: student_id, role: 'student' });
    if (!student) {
      return res.status(400).json({ message: 'student_id must reference a user with role "student"' });
    }
    const cohort = await Cohort.findById(cohort_id);
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    const existing = await Enrollment.findOne({ student_id, cohort_id });
    if (existing) {
      return res.status(400).json({ message: 'This student is already enrolled in this cohort' });
    }

    const enrollment = await Enrollment.create({
      student_id,
      cohort_id,
    });
    await initializeEnrollmentFee(enrollment, { alreadyPaid: payment_status === 'paid' });

    res.status(201).json({ enrollment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create enrollment', error: err.message });
  }
};

// PATCH /api/admin/academy/enrollments/:id — update status (active/completed/
// dropped) only. payment_status is derived from amount_paid/total_fee and
// can only change by recording Payment installments — never set directly,
// so it can't drift out of sync with the actual ledger.
const updateEnrollment = async (req, res) => {
  try {
    const { status } = req.body;
    if (status && !ENROLLMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ENROLLMENT_STATUSES.join(', ')}` });
    }

    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (status !== undefined) enrollment.status = status;

    await enrollment.save();
    res.json({ enrollment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update enrollment', error: err.message });
  }
};

// ---------- Attendance ----------

// GET /api/admin/academy/cohorts/:id/attendance — full history for a cohort
const getCohortAttendance = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    const records = await Attendance.find({ cohort_id: req.params.id })
      .populate('student_id', 'name email')
      .sort({ date: -1 });

    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load attendance', error: err.message });
  }
};

// ---------- Payments (offline, admin-managed) ----------

// GET /api/admin/academy/payments?status=pending&cohort_id=...
const listPayments = async (req, res) => {
  try {
    const { status, cohort_id, student_id, enrollment_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (cohort_id) filter.cohort_id = cohort_id;
    if (student_id) filter.student_id = student_id;
    if (enrollment_id) filter.enrollment_id = enrollment_id;

    const payments = await Payment.find(filter)
      .populate('student_id', 'name email')
      .populate({
        path: 'cohort_id',
        select: 'name course_id',
        populate: { path: 'course_id', select: 'title' },
      })
      .sort({ created_at: -1 });

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load payments', error: err.message });
  }
};

// Applies status-dependent rules for payment_method/paid_at onto a
// not-yet-saved Payment installment (new or existing). Returns an error
// message string if invalid, otherwise null. An installment is a single
// discrete amount — either not yet collected ("pending") or fully collected
// and verified ("paid"); there's no partial state on one installment
// anymore, a part-payment is just its own smaller installment.
const applyPaymentStatusRules = (payment, { status, payment_method }) => {
  const resolvedStatus = status !== undefined ? status : payment.status;

  if (resolvedStatus === 'paid' && !payment_method && !payment.payment_method) {
    return 'payment_method is required when marking an installment as paid';
  }
  if (payment_method !== undefined) payment.payment_method = payment_method;

  payment.paid_at = resolvedStatus === 'paid' ? (payment.paid_at || new Date()) : null;
  payment.status = resolvedStatus;
  return null;
};

// POST /api/admin/academy/payments — record a new installment against an
// existing enrollment. Multiple installments per enrollment are expected —
// a student paying in three parts means three of these records.
// { student_id, cohort_id, amount, status?, payment_method?, reference_note? }
const createPayment = async (req, res) => {
  try {
    const { student_id, cohort_id, amount, status, payment_method, reference_note } = req.body;
    if (!student_id || !cohort_id || amount === undefined || amount === '') {
      return res.status(400).json({ message: 'student_id, cohort_id, and amount are required' });
    }
    if (!(Number(amount) > 0)) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }
    if (status && !PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }
    if (payment_method && !PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ message: `payment_method must be one of: ${PAYMENT_METHODS.join(', ')}` });
    }

    const student = await User.findOne({ _id: student_id, role: 'student' });
    if (!student) {
      return res.status(400).json({ message: 'student_id must reference a user with role "student"' });
    }
    const cohort = await Cohort.findById(cohort_id);
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }
    const enrollment = await Enrollment.findOne({ student_id, cohort_id });
    if (!enrollment) {
      return res.status(400).json({ message: 'This student is not enrolled in that cohort yet — enroll them first' });
    }

    const payment = new Payment({
      enrollment_id: enrollment._id,
      student_id,
      cohort_id,
      amount: Number(amount),
      reference_note: reference_note || '',
    });
    const ruleError = applyPaymentStatusRules(payment, { status: status || 'pending', payment_method });
    if (ruleError) {
      return res.status(400).json({ message: ruleError });
    }
    await payment.save();
    if (payment.status === 'paid') {
      await applyVerifiedPaymentToEnrollment(payment);
      await recordPayoutAccrual(payment);
    }

    const populated = await Payment.findById(payment._id)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    if (payment.status === 'paid' && populated.student_id) {
      await sendPaymentConfirmedEmail(populated.student_id.email, {
        name: populated.student_id.name,
        amount: payment.amount,
        itemLabel: `${populated.cohort_id?.course_id?.title || 'course'} — ${populated.cohort_id?.name || ''}`,
        paymentMethod: payment.payment_method,
        date: payment.paid_at,
      });
    }

    res.status(201).json({ payment: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment', error: err.message });
  }
};

// PATCH /api/admin/academy/payments/:id — mark an installment paid (or edit
// its amount/method/note while still pending). Once an installment is paid
// it's locked — its amount can no longer change, since that would silently
// desync the enrollment's amount_paid/balance_remaining and the
// instructor's payout ledger from what was actually verified.
const updatePayment = async (req, res) => {
  try {
    const { amount, status, payment_method, reference_note } = req.body;
    if (status && !PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }
    if (payment_method && !PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({ message: `payment_method must be one of: ${PAYMENT_METHODS.join(', ')}` });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    const wasAlreadyPaid = payment.status === 'paid';

    if (amount !== undefined && amount !== '' && Number(amount) !== payment.amount) {
      if (wasAlreadyPaid) {
        return res.status(400).json({ message: 'This installment has already been verified paid and its amount is locked — delete it and record a new one to correct a mistake' });
      }
      if (!(Number(amount) > 0)) {
        return res.status(400).json({ message: 'amount must be greater than 0' });
      }
      payment.amount = Number(amount);
    }
    if (reference_note !== undefined) payment.reference_note = reference_note;

    const ruleError = applyPaymentStatusRules(payment, { status, payment_method });
    if (ruleError) {
      return res.status(400).json({ message: ruleError });
    }

    await payment.save();
    // Only verify on the pending -> paid transition — re-saving an
    // already-paid record (e.g. fixing a typo in the note) must not
    // double-count it against the enrollment or the payout ledger.
    if (payment.status === 'paid' && !wasAlreadyPaid) {
      await applyVerifiedPaymentToEnrollment(payment);
      await recordPayoutAccrual(payment);
    }

    const populated = await Payment.findById(payment._id)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    if (payment.status === 'paid' && !wasAlreadyPaid && populated.student_id) {
      await sendPaymentConfirmedEmail(populated.student_id.email, {
        name: populated.student_id.name,
        amount: payment.amount,
        itemLabel: `${populated.cohort_id?.course_id?.title || 'course'} — ${populated.cohort_id?.name || ''}`,
        paymentMethod: payment.payment_method,
        date: payment.paid_at,
      });
    }

    res.json({ payment: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update payment', error: err.message });
  }
};

// DELETE /api/admin/academy/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'This installment has already been verified paid — it has already fed into the enrollment balance and the instructor payout ledger, so it can\'t be deleted' });
    }
    await payment.deleteOne();
    res.json({ message: 'Payment deleted', id: payment._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete payment', error: err.message });
  }
};

// ---------- Instructor Payouts (event-driven ledger, paid offline) ----------

// GET /api/admin/academy/payouts?cohort_id=... — one row per cohort,
// including cohorts with no accruals yet (unpaid_amount/paid_amount at 0),
// so admin sees the full picture, not just cohorts a payment has touched.
const listPayouts = async (req, res) => {
  try {
    const { cohort_id } = req.query;
    const cohorts = await Cohort.find(cohort_id ? { _id: cohort_id } : {});
    await Promise.all(cohorts.map(ensurePayoutForCohort));

    const filter = {};
    if (cohort_id) filter.cohort_id = cohort_id;

    const payouts = await InstructorPayout.find(filter)
      .populate('instructor_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } })
      .populate('transactions.student_id', 'name')
      .sort({ created_at: -1 });

    // Outstanding balances (money not yet collected) per cohort, for the
    // "Projected Additional Payout" figure — informational only, never
    // added to the real unpaid_amount ledger since it hasn't been paid yet.
    const balanceRows = await Enrollment.aggregate([
      { $match: { cohort_id: { $in: cohorts.map((c) => c._id) } } },
      { $group: { _id: '$cohort_id', total_balance: { $sum: '$balance_remaining' } } },
    ]);
    const balanceByCohortId = new Map(balanceRows.map((r) => [String(r._id), r.total_balance]));
    const percentByCohortId = new Map(cohorts.map((c) => [String(c._id), c.instructor_payout_percent ?? DEFAULT_PAYOUT_PERCENT]));

    // students_count is purely informational context — it never drives the
    // payout math, which lives entirely in the transaction ledger.
    const withExtras = await Promise.all(payouts.map(async (payout) => {
      const cohortIdStr = String(payout.cohort_id?._id || payout.cohort_id);
      const totalBalance = balanceByCohortId.get(cohortIdStr) || 0;
      const percent = percentByCohortId.get(cohortIdStr) ?? payout.payout_percent_used;
      return {
        ...payout.toObject(),
        students_count: await Enrollment.countDocuments({ cohort_id: payout.cohort_id?._id || payout.cohort_id, status: 'active' }),
        projected_additional_payout: Math.round(totalBalance * (percent / 100)),
      };
    }));

    res.json({ payouts: withExtras });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load payouts', error: err.message });
  }
};

// POST /api/admin/academy/payouts/:id/pay — pays the instructor the CURRENT
// unpaid_amount: moves it onto paid_amount and resets unpaid_amount to 0,
// logging a 'payout' transaction. Never touches money already recorded as
// paid; any new student payments verified after this accrue fresh from 0.
const payInstructor = async (req, res) => {
  try {
    const payout = await InstructorPayout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }
    if (payout.unpaid_amount <= 0) {
      return res.status(400).json({ message: 'Nothing is currently owed to this instructor for this cohort' });
    }

    const paidAt = new Date();
    const amountPaidOut = payout.unpaid_amount;
    payout.paid_amount += amountPaidOut;
    payout.unpaid_amount = 0;
    payout.last_paid_at = paidAt;
    payout.transactions.push({ type: 'payout', amount: amountPaidOut, created_at: paidAt });

    await payout.save();

    const populated = await InstructorPayout.findById(payout._id)
      .populate('instructor_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } })
      .populate('transactions.student_id', 'name');

    res.json({ payout: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to record payout', error: err.message });
  }
};

// ---------- Certificates (placeholder PDF, generated offline-completion) ----------

// POST /api/admin/academy/certificates — { student_id, cohort_id }. Generates
// a placeholder completion certificate for a student who has finished a
// cohort. Idempotent: if one already exists for this student+cohort, returns
// the existing record instead of generating (and uploading) a duplicate.
const generateCertificate = async (req, res) => {
  try {
    const { student_id, cohort_id } = req.body;
    if (!student_id || !cohort_id) {
      return res.status(400).json({ message: 'student_id and cohort_id are required' });
    }

    const existing = await Certificate.findOne({ student_id, cohort_id })
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });
    if (existing) {
      return res.status(200).json({ certificate: existing });
    }

    const enrollment = await Enrollment.findOne({ student_id, cohort_id });
    if (!enrollment) {
      return res.status(400).json({ message: 'This student is not enrolled in that cohort' });
    }
    if (enrollment.status !== 'completed') {
      return res.status(400).json({ message: 'This enrollment must be marked "completed" before a certificate can be generated' });
    }

    const student = await User.findOne({ _id: student_id, role: 'student' });
    const cohort = await Cohort.findById(cohort_id).populate('course_id', 'title');
    if (!student || !cohort) {
      return res.status(404).json({ message: 'Student or cohort not found' });
    }

    const issued_at = new Date();
    const pdfBuffer = await buildCertificatePdf({
      studentName: student.name,
      courseTitle: cohort.course_id?.title || cohort.name,
      issuedAt: issued_at,
    });
    const { url } = await uploadFile(
      { originalname: `certificate-${student._id}-${cohort._id}.pdf`, buffer: pdfBuffer, mimetype: 'application/pdf' },
      'certificates'
    );

    const certificate = await Certificate.create({
      student_id,
      cohort_id,
      issued_at,
      certificate_url: url,
    });

    const populated = await Certificate.findById(certificate._id)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    res.status(201).json({ certificate: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate certificate', error: err.message });
  }
};

// GET /api/admin/academy/certificates?cohort_id=...&student_id=...
const listCertificates = async (req, res) => {
  try {
    const { cohort_id, student_id } = req.query;
    const filter = {};
    if (cohort_id) filter.cohort_id = cohort_id;
    if (student_id) filter.student_id = student_id;

    const certificates = await Certificate.find(filter)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } })
      .sort({ issued_at: -1 });

    res.json({ certificates });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load certificates', error: err.message });
  }
};

// ---------- Cohort waitlist ----------

// GET /api/admin/academy/waitlist?course_id=...&cohort_id=...
const listWaitlist = async (req, res) => {
  try {
    const { course_id, cohort_id } = req.query;
    const filter = {};
    if (course_id) filter.course_id = course_id;
    if (cohort_id) filter.cohort_id = cohort_id;

    const entries = await CohortWaitlistEntry.find(filter)
      .populate('course_id', 'title')
      .populate('cohort_id', 'name')
      .sort({ joined_at: -1 });

    res.json({ entries });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load waitlist', error: err.message });
  }
};

// PATCH /api/admin/academy/waitlist/:id/convert — { cohort_id }. Same rule
// as convertRegistration: only works once the person already has a student
// account (created via invite code, matched by email) — connects the
// waitlist entry to a real Enrollment in the newly-opened cohort.
const convertWaitlistEntry = async (req, res) => {
  try {
    const { cohort_id } = req.body;
    if (!cohort_id) {
      return res.status(400).json({ message: 'cohort_id is required' });
    }

    const entry = await CohortWaitlistEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }
    if (entry.status === 'converted') {
      return res.status(400).json({ message: 'This waitlist entry has already been converted' });
    }

    const cohort = await Cohort.findById(cohort_id).populate('course_id', 'title');
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    const student = await User.findOne({ email: entry.email, role: 'student' });
    if (!student) {
      return res.status(400).json({ message: 'No student account found for this email yet — generate an invite code and confirm they have signed up first' });
    }

    const existing = await Enrollment.findOne({ student_id: student._id, cohort_id });
    if (existing) {
      return res.status(400).json({ message: 'This student is already enrolled in this cohort' });
    }

    const enrollment = await Enrollment.create({
      student_id: student._id,
      cohort_id,
    });
    await initializeEnrollmentFee(enrollment);

    entry.status = 'converted';
    await entry.save();

    await sendEnrollmentWelcomeEmail(student.email, {
      name: student.name,
      courseTitle: cohort.course_id?.title || 'your course',
      cohortName: cohort.name,
    });

    res.status(201).json({ enrollment, entry });
  } catch (err) {
    res.status(500).json({ message: 'Failed to convert waitlist entry', error: err.message });
  }
};

// POST /api/admin/academy/courses/:courseId/waitlist/notify — { cohort_id }.
// Manual trigger (not automatic) — emails everyone still 'waiting' on this
// course's waitlist that the given cohort has opened, then flips them to
// 'notified' so a repeat click doesn't double-email the same people.
const notifyCourseWaitlist = async (req, res) => {
  try {
    const { cohort_id } = req.body;
    if (!cohort_id) {
      return res.status(400).json({ message: 'cohort_id is required' });
    }

    const cohort = await Cohort.findOne({ _id: cohort_id, course_id: req.params.courseId }).populate('course_id', 'title');
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found for this course' });
    }

    const waitingEntries = await CohortWaitlistEntry.find({ course_id: req.params.courseId, status: 'waiting' });

    const registerUrl = `${process.env.CLIENT_URL || 'https://kaytechhub.com'}/courses/${req.params.courseId}/register`;
    await Promise.all(waitingEntries.map((entry) => sendCohortWaitlistOpenEmail(entry.email, {
      name: entry.name,
      courseTitle: cohort.course_id?.title || 'your course',
      cohortName: cohort.name,
      registerUrl,
    })));

    await CohortWaitlistEntry.updateMany(
      { _id: { $in: waitingEntries.map((e) => e._id) } },
      { status: 'notified' }
    );

    res.json({ notified: waitingEntries.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to notify waitlist', error: err.message });
  }
};

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  getCourseContent,
  listCohorts,
  getCohort,
  createCohort,
  updateCohort,
  listPendingModules,
  listPendingLessons,
  reviewModule,
  reviewLesson,
  deleteModule,
  deleteLesson,
  listRegistrations,
  updateRegistration,
  convertRegistration,
  listEnrollments,
  createEnrollment,
  updateEnrollment,
  getCohortAttendance,
  listPayments,
  createPayment,
  updatePayment,
  deletePayment,
  listPayouts,
  payInstructor,
  generateCertificate,
  listCertificates,
  listWaitlist,
  convertWaitlistEntry,
  notifyCourseWaitlist,
};
