const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const CourseRegistration = require('../models/CourseRegistration');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const COURSE_STATUSES = ['draft', 'published', 'archived'];
const COHORT_STATUSES = ['upcoming', 'active', 'completed'];
const REVIEW_ACTIONS = ['approve', 'reject'];
const REGISTRATION_STATUSES = ['new', 'contacted', 'confirmed', 'declined', 'converted'];
const PAYMENT_STATUSES = ['pending', 'partial', 'paid'];
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'other'];
const ENROLLMENT_STATUSES = ['active', 'completed', 'dropped'];

// Creates the Payment ledger record that tracks an Enrollment's tuition —
// amount defaults to the cohort's course price. Used by both createEnrollment
// and convertRegistration, the two places an Enrollment gets created.
const createPaymentForEnrollment = async (enrollment) => {
  const cohort = await Cohort.findById(enrollment.cohort_id).populate('course_id', 'price');
  const amount = cohort?.course_id?.price || 0;
  await Payment.create({
    student_id: enrollment.student_id,
    cohort_id: enrollment.cohort_id,
    amount,
    amount_paid: enrollment.payment_status === 'paid' ? amount : 0,
    status: enrollment.payment_status,
    paid_at: enrollment.payment_status === 'paid' ? new Date() : null,
  });
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
    const { title, description, category, duration, price, requirements, curriculum, status } = req.body;
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

    res.json({ cohorts });
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
    const { course_id, instructor_id, name, start_date, end_date, rate_per_student, status } = req.body;
    if (!course_id || !instructor_id || !name || !start_date || !end_date || rate_per_student === undefined || rate_per_student === '') {
      return res.status(400).json({ message: 'course_id, instructor_id, name, start_date, end_date, and rate_per_student are required' });
    }
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    if (status && !COHORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${COHORT_STATUSES.join(', ')}` });
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
      rate_per_student: Number(rate_per_student),
      status: status || 'upcoming',
    });

    res.status(201).json({ cohort });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create cohort', error: err.message });
  }
};

// PATCH /api/admin/academy/cohorts/:id
const updateCohort = async (req, res) => {
  try {
    const { instructor_id, name, start_date, end_date, rate_per_student, status } = req.body;
    if (status && !COHORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${COHORT_STATUSES.join(', ')}` });
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
    if (rate_per_student !== undefined) cohort.rate_per_student = Number(rate_per_student);
    if (status !== undefined) cohort.status = status;

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

    const cohort = await Cohort.findById(cohort_id);
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
      payment_status: registration.payment_status,
    });
    await createPaymentForEnrollment(enrollment);

    registration.status = 'converted';
    await registration.save();

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

    res.json({ enrollments });
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
      payment_status: payment_status || 'pending',
    });
    await createPaymentForEnrollment(enrollment);

    res.status(201).json({ enrollment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create enrollment', error: err.message });
  }
};

// PATCH /api/admin/academy/enrollments/:id — update status and/or payment_status
const updateEnrollment = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    if (status && !ENROLLMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ENROLLMENT_STATUSES.join(', ')}` });
    }
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ message: `Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}` });
    }

    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (status !== undefined) enrollment.status = status;
    if (payment_status !== undefined) enrollment.payment_status = payment_status;

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
    const { status, cohort_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (cohort_id) filter.cohort_id = cohort_id;

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

// Keeps Enrollment.payment_status mirrored to a Payment's status, since
// dashboard revenue and the Enrollments table both read from that field.
const syncEnrollmentPaymentStatus = async (payment) => {
  await Enrollment.updateOne(
    { student_id: payment.student_id, cohort_id: payment.cohort_id },
    { payment_status: payment.status },
  );
};

// Applies the status-dependent rules for amount_paid/payment_method/paid_at
// onto a not-yet-saved Payment doc (new or existing). Returns an error
// message string if the combination is invalid, otherwise null.
// - pending: nothing collected yet — amount_paid resets to 0, no method needed.
// - partial: some money in — amount_paid required, must be less than the total.
// - paid: paid in full — amount_paid is forced to the total (can't be
//   partially "paid", that's what the partial status is for).
const applyPaymentStatusRules = (payment, { status, amount_paid, payment_method }) => {
  const resolvedStatus = status !== undefined ? status : payment.status;

  if (resolvedStatus !== 'pending' && !payment_method && !payment.payment_method) {
    return 'payment_method is required once any money has been received';
  }
  if (payment_method !== undefined) payment.payment_method = payment_method;

  if (resolvedStatus === 'pending') {
    payment.amount_paid = 0;
    payment.paid_at = null;
  } else if (resolvedStatus === 'partial') {
    const resolvedAmountPaid = amount_paid !== undefined && amount_paid !== '' ? Number(amount_paid) : payment.amount_paid;
    if (!(resolvedAmountPaid > 0) || resolvedAmountPaid >= payment.amount) {
      return 'amount_paid must be greater than 0 and less than the total amount for a part payment — use "Completed Payment" if the full amount has been received';
    }
    payment.amount_paid = resolvedAmountPaid;
    payment.paid_at = new Date();
  } else if (resolvedStatus === 'paid') {
    payment.amount_paid = payment.amount;
    payment.paid_at = new Date();
  }

  payment.status = resolvedStatus;
  return null;
};

// POST /api/admin/academy/payments — manually record a payment for an
// existing enrollment (e.g. one created before this feature shipped, or a
// second/adjustment entry). { student_id, cohort_id, amount, status?, amount_paid?, payment_method?, reference_note? }
const createPayment = async (req, res) => {
  try {
    const { student_id, cohort_id, amount, status, amount_paid, payment_method, reference_note } = req.body;
    if (!student_id || !cohort_id || amount === undefined || amount === '') {
      return res.status(400).json({ message: 'student_id, cohort_id, and amount are required' });
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
    const existing = await Payment.findOne({ student_id, cohort_id });
    if (existing) {
      return res.status(400).json({ message: 'A payment record already exists for this student/cohort — edit it instead' });
    }

    const payment = new Payment({
      student_id,
      cohort_id,
      amount: Number(amount),
      reference_note: reference_note || '',
    });
    const ruleError = applyPaymentStatusRules(payment, { status: status || 'pending', amount_paid, payment_method });
    if (ruleError) {
      return res.status(400).json({ message: ruleError });
    }
    await payment.save();
    await syncEnrollmentPaymentStatus(payment);

    const populated = await Payment.findById(payment._id)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    res.status(201).json({ payment: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment', error: err.message });
  }
};

// PATCH /api/admin/academy/payments/:id — edit amount/method/note, or move
// between pending/partial/paid. Covers the everyday "record this payment"
// action as well as later corrections (wrong amount, wrong method, undoing a
// mistaken status change).
const updatePayment = async (req, res) => {
  try {
    const { amount, status, amount_paid, payment_method, reference_note } = req.body;
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

    if (amount !== undefined && amount !== '') payment.amount = Number(amount);
    if (reference_note !== undefined) payment.reference_note = reference_note;

    const ruleError = applyPaymentStatusRules(payment, { status, amount_paid, payment_method });
    if (ruleError) {
      return res.status(400).json({ message: ruleError });
    }

    await payment.save();
    await syncEnrollmentPaymentStatus(payment);

    const populated = await Payment.findById(payment._id)
      .populate('student_id', 'name email')
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } });

    res.json({ payment: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update payment', error: err.message });
  }
};

// DELETE /api/admin/academy/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted', id: payment._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete payment', error: err.message });
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
};
