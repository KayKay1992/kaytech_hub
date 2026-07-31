const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const InstructorPayout = require('../models/InstructorPayout');
const { uploadFile } = require('../utils/upload');

const DEFAULT_PAYOUT_PERCENT = 35;

// Per-student payment detail for a cohort — what each student owes
// (total_fee), has paid (amount_paid), and still has outstanding
// (balance_remaining) — plus a paid/partial/pending count breakdown
// derived from the same list (one query covers both). Reads straight off
// Enrollment, which is the single source of truth for these numbers now
// (kept in sync automatically whenever a Payment installment is verified).
const getCohortPaymentDetails = async (cohortId) => {
  const enrollments = await Enrollment.find({ cohort_id: cohortId })
    .populate('student_id', 'name email')
    .sort({ payment_status: 1 });

  const breakdown = { paid: 0, partial: 0, pending: 0 };
  const students = enrollments.map((e) => {
    breakdown[e.payment_status] = (breakdown[e.payment_status] || 0) + 1;
    return {
      student_id: e.student_id?._id,
      name: e.student_id?.name || 'Unknown student',
      email: e.student_id?.email || '',
      amount: e.total_fee,
      amount_paid: e.amount_paid,
      balance: e.balance_remaining,
      status: e.payment_status,
    };
  });

  return { breakdown, students };
};

// An instructor may only create/manage content for a course they're
// assigned to teach via at least one Cohort.
const isAssignedToCourse = (instructorId, courseId) =>
  Cohort.exists({ instructor_id: instructorId, course_id: courseId });

// Assignments are cohort-specific, so the check is against that exact
// cohort rather than "any cohort of this course".
const isAssignedToCohort = (instructorId, cohortId) =>
  Cohort.exists({ _id: cohortId, instructor_id: instructorId });

// Ensures every cohort I teach has an InstructorPayout ledger row, even
// ones with no accruals yet, so my payouts list shows every cohort at ₦0
// rather than only ones a payment has touched. Read-only view — this never
// touches unpaid_amount/paid_amount, which only change via admin actions
// (a verified student Payment, or admin paying me out).
const ensurePayoutForCohort = async (cohort) => {
  const existing = await InstructorPayout.findOne({ cohort_id: cohort._id });
  if (existing) return existing;
  return InstructorPayout.create({
    instructor_id: cohort.instructor_id,
    cohort_id: cohort._id,
    unpaid_amount: 0,
    paid_amount: 0,
    payout_percent_used: cohort.instructor_payout_percent ?? DEFAULT_PAYOUT_PERCENT,
  });
};

// Parses the `resource_links` JSON string (link-type resources) and combines
// it with any uploaded `resource_files` (file-type resources, labeled by
// their original filename) into one resources array.
const buildResources = async (req, resourceLinksRaw) => {
  const resources = [];

  if (resourceLinksRaw) {
    try {
      const parsed = JSON.parse(resourceLinksRaw);
      if (Array.isArray(parsed)) {
        for (const link of parsed) {
          if (link && link.label && link.url) {
            resources.push({ label: link.label, url: link.url, type: 'link' });
          }
        }
      }
    } catch {
      // Malformed JSON from the client — treat as no links rather than fail the request.
    }
  }

  if (req.files?.resource_files?.length) {
    for (const file of req.files.resource_files) {
      const result = await uploadFile(file, 'lesson-resources');
      resources.push({ label: file.originalname, url: result.url, type: 'file' });
    }
  }

  return resources;
};

// GET /api/instructor/courses — courses I'm assigned to via any cohort
const listMyCourses = async (req, res) => {
  try {
    const courseIds = await Cohort.find({ instructor_id: req.user._id }).distinct('course_id');
    const courses = await Course.find({ _id: { $in: courseIds } }).sort({ title: 1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your courses', error: err.message });
  }
};

// GET /api/instructor/courses/:courseId/content — full module/lesson tree,
// every status (instructor sees their own work regardless of review state)
const getCourseContent = async (req, res) => {
  try {
    const assigned = await isAssignedToCourse(req.user._id, req.params.courseId);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const modules = await Module.find({ course_id: course._id }).sort({ order: 1, created_at: 1 });
    const lessons = await Lesson.find({ module_id: { $in: modules.map((m) => m._id) } }).sort({ order: 1, created_at: 1 });

    const modulesWithLessons = modules.map((mod) => ({
      ...mod.toObject(),
      lessons: lessons.filter((lesson) => String(lesson.module_id) === String(mod._id)),
    }));

    res.json({ course, modules: modulesWithLessons });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load course content', error: err.message });
  }
};

// POST /api/instructor/modules
const createModule = async (req, res) => {
  try {
    const { course_id, title, order } = req.body;
    if (!course_id || !title) {
      return res.status(400).json({ message: 'course_id and title are required' });
    }

    const assigned = await isAssignedToCourse(req.user._id, course_id);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    let moduleOrder = order;
    if (moduleOrder === undefined || moduleOrder === '') {
      moduleOrder = await Module.countDocuments({ course_id });
    }

    const mod = await Module.create({
      course_id,
      title,
      order: Number(moduleOrder),
      status: 'pending',
      created_by: req.user._id,
    });

    res.status(201).json({ module: mod });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create module', error: err.message });
  }
};

// PATCH /api/instructor/modules/:id — edits always revert status to pending
const updateModule = async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id);
    if (!mod) {
      return res.status(404).json({ message: 'Module not found' });
    }
    if (String(mod.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this module can edit it' });
    }

    const { title, order } = req.body;
    if (title !== undefined) mod.title = title;
    if (order !== undefined && order !== '') mod.order = Number(order);

    mod.status = 'pending';
    mod.rejection_reason = '';

    await mod.save();
    res.json({ module: mod });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update module', error: err.message });
  }
};

// DELETE /api/instructor/modules/:id — creator only; cascades to its lessons
const deleteModule = async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id);
    if (!mod) {
      return res.status(404).json({ message: 'Module not found' });
    }
    if (String(mod.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this module can delete it' });
    }

    await Lesson.deleteMany({ module_id: mod._id });
    await mod.deleteOne();

    res.json({ message: 'Module deleted', id: mod._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete module', error: err.message });
  }
};

// POST /api/instructor/lessons — multipart: notes_file (PDF), resource_files[], + fields
const createLesson = async (req, res) => {
  try {
    const { module_id, title, coding_exercise, order, resource_links } = req.body;
    if (!module_id || !title) {
      return res.status(400).json({ message: 'module_id and title are required' });
    }

    const mod = await Module.findById(module_id);
    if (!mod) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const assigned = await isAssignedToCourse(req.user._id, mod.course_id);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    let notes_file_url = '';
    if (req.files?.notes_file?.[0]) {
      const file = req.files.notes_file[0];
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Notes file must be a PDF' });
      }
      const result = await uploadFile(file, 'lesson-notes');
      notes_file_url = result.url;
    }

    const resources = await buildResources(req, resource_links);

    let lessonOrder = order;
    if (lessonOrder === undefined || lessonOrder === '') {
      lessonOrder = await Lesson.countDocuments({ module_id });
    }

    const lesson = await Lesson.create({
      module_id,
      title,
      notes_file_url,
      resources,
      coding_exercise: coding_exercise || '',
      order: Number(lessonOrder),
      status: 'pending',
      created_by: req.user._id,
    });

    res.status(201).json({ lesson });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create lesson', error: err.message });
  }
};

// PATCH /api/instructor/lessons/:id — edits always revert status to pending
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    if (String(lesson.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this lesson can edit it' });
    }

    const { title, coding_exercise, order, resource_links } = req.body;
    if (title !== undefined) lesson.title = title;
    if (coding_exercise !== undefined) lesson.coding_exercise = coding_exercise;
    if (order !== undefined && order !== '') lesson.order = Number(order);

    if (resource_links !== undefined || req.files?.resource_files?.length) {
      lesson.resources = await buildResources(req, resource_links);
    }

    if (req.files?.notes_file?.[0]) {
      const file = req.files.notes_file[0];
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Notes file must be a PDF' });
      }
      const result = await uploadFile(file, 'lesson-notes');
      lesson.notes_file_url = result.url;
    }

    lesson.status = 'pending';
    lesson.rejection_reason = '';

    await lesson.save();
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update lesson', error: err.message });
  }
};

// DELETE /api/instructor/lessons/:id — creator only
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    if (String(lesson.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this lesson can delete it' });
    }

    await lesson.deleteOne();
    res.json({ message: 'Lesson deleted', id: lesson._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete lesson', error: err.message });
  }
};

// GET /api/instructor/cohorts — cohorts I teach, for the assignment cohort picker
const listMyCohorts = async (req, res) => {
  try {
    const cohorts = await Cohort.find({ instructor_id: req.user._id })
      .populate('course_id', 'title image_url')
      .sort({ start_date: -1 });
    res.json({ cohorts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your cohorts', error: err.message });
  }
};

// GET /api/instructor/dashboard/stats — the one aggregate no other endpoint
// exposes: how many submissions across every assignment I've created still
// need a grade, a quick list of the most recent ones, and my next few
// assignment due dates. Everything else on my dashboard (cohort roster,
// payout totals, notifications) already has a dedicated endpoint.
const getDashboardStats = async (req, res) => {
  try {
    const cohortIds = await Cohort.find({ instructor_id: req.user._id }).distinct('_id');
    const assignments = await Assignment.find({ cohort_id: { $in: cohortIds } })
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } })
      .sort({ due_date: 1 });
    const assignmentById = new Map(assignments.map((a) => [String(a._id), a]));

    const submissions = await Submission.find({ assignment_id: { $in: assignments.map((a) => a._id) } })
      .populate('student_id', 'name')
      .sort({ submitted_at: -1 });

    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter((s) => s.score !== null && s.score !== undefined).length;

    const recentUngraded = submissions
      .filter((s) => s.score === null || s.score === undefined)
      .slice(0, 5)
      .map((s) => {
        const assignment = assignmentById.get(String(s.assignment_id));
        return {
          _id: s._id,
          assignment_id: s.assignment_id,
          assignment_title: assignment?.title || 'Assignment',
          cohort_name: assignment?.cohort_id?.name || '',
          student_name: s.student_id?.name || 'Student',
          submitted_at: s.submitted_at,
        };
      });

    const upcomingAssignments = assignments
      .filter((a) => new Date(a.due_date) >= new Date())
      .slice(0, 5)
      .map((a) => ({
        _id: a._id,
        title: a.title,
        due_date: a.due_date,
        cohort_name: a.cohort_id?.name || '',
        course_title: a.cohort_id?.course_id?.title || '',
      }));

    res.json({
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      recentUngraded,
      upcomingAssignments,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard stats', error: err.message });
  }
};

// GET /api/instructor/cohorts/:cohortId/assignments
const listCohortAssignments = async (req, res) => {
  try {
    const assigned = await isAssignedToCohort(req.user._id, req.params.cohortId);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this cohort' });
    }

    const assignments = await Assignment.find({ cohort_id: req.params.cohortId })
      .populate('lesson_id', 'title')
      .sort({ due_date: 1 });

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load assignments', error: err.message });
  }
};

// POST /api/instructor/assignments
const createAssignment = async (req, res) => {
  try {
    const { cohort_id, lesson_id, title, description, due_date } = req.body;
    if (!cohort_id || !title || !due_date) {
      return res.status(400).json({ message: 'cohort_id, title, and due_date are required' });
    }

    const assigned = await isAssignedToCohort(req.user._id, cohort_id);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this cohort' });
    }

    const assignment = await Assignment.create({
      cohort_id,
      lesson_id: lesson_id || null,
      title,
      description: description || '',
      due_date,
      created_by: req.user._id,
    });

    res.status(201).json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create assignment', error: err.message });
  }
};

// PATCH /api/instructor/assignments/:id — creator only
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (String(assignment.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this assignment can edit it' });
    }

    const { lesson_id, title, description, due_date } = req.body;
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (due_date !== undefined) assignment.due_date = due_date;
    if (lesson_id !== undefined) assignment.lesson_id = lesson_id || null;

    await assignment.save();
    res.json({ assignment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update assignment', error: err.message });
  }
};

// DELETE /api/instructor/assignments/:id — creator only; cascades to submissions
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (String(assignment.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this assignment can delete it' });
    }

    await Submission.deleteMany({ assignment_id: assignment._id });
    await assignment.deleteOne();

    res.json({ message: 'Assignment deleted', id: assignment._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete assignment', error: err.message });
  }
};

// GET /api/instructor/assignments/:id/submissions — creator only
const listAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (String(assignment.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this assignment can view its submissions' });
    }

    const submissions = await Submission.find({ assignment_id: assignment._id })
      .populate('student_id', 'name email')
      .sort({ submitted_at: -1 });

    res.json({ assignment, submissions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load submissions', error: err.message });
  }
};

// PATCH /api/instructor/submissions/:id/grade — { score, feedback }
const gradeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('assignment_id');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    if (String(submission.assignment_id.created_by) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the instructor who created this assignment can grade it' });
    }

    const { score, feedback } = req.body;
    if (score !== undefined && score !== '') {
      const numericScore = Number(score);
      if (Number.isNaN(numericScore) || numericScore < 0) {
        return res.status(400).json({ message: 'Score must be a non-negative number' });
      }
      submission.score = numericScore;
    }
    if (feedback !== undefined) submission.feedback = feedback;

    await submission.save();
    res.json({ submission });
  } catch (err) {
    res.status(500).json({ message: 'Failed to grade submission', error: err.message });
  }
};

// GET /api/instructor/cohorts/:cohortId/attendance/roster?date=YYYY-MM-DD
// Every enrolled student, merged with any attendance already saved for that
// date (null status = not yet marked).
const getAttendanceRoster = async (req, res) => {
  try {
    const assigned = await isAssignedToCohort(req.user._id, req.params.cohortId);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this cohort' });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }

    const enrollments = await Enrollment.find({ cohort_id: req.params.cohortId }).populate('student_id', 'name email');
    const records = await Attendance.find({ cohort_id: req.params.cohortId, date: new Date(date) });
    const statusByStudentId = new Map(records.map((r) => [String(r.student_id), r.status]));

    const roster = enrollments.map((e) => ({
      student_id: e.student_id._id,
      name: e.student_id.name,
      email: e.student_id.email,
      status: statusByStudentId.get(String(e.student_id._id)) || null,
    }));

    res.json({ date, roster });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load attendance roster', error: err.message });
  }
};

// POST /api/instructor/cohorts/:cohortId/attendance — { date, records: [{student_id, status}] }
// Upserts one Attendance doc per student for that date — safe to resave an
// already-marked date to correct a mistake.
const saveAttendance = async (req, res) => {
  try {
    const assigned = await isAssignedToCohort(req.user._id, req.params.cohortId);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this cohort' });
    }

    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'date and a non-empty records array are required' });
    }

    const day = new Date(date);
    await Promise.all(records.map(({ student_id, status }) => {
      if (!['present', 'absent'].includes(status)) return null;
      return Attendance.findOneAndUpdate(
        { cohort_id: req.params.cohortId, student_id, date: day },
        { status },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }));

    res.json({ message: 'Attendance saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save attendance', error: err.message });
  }
};

// GET /api/instructor/cohorts/:cohortId/attendance/history — one row per
// class date already marked, with present/absent counts, newest first.
const getAttendanceHistory = async (req, res) => {
  try {
    const assigned = await isAssignedToCohort(req.user._id, req.params.cohortId);
    if (!assigned) {
      return res.status(403).json({ message: 'You are not assigned to this cohort' });
    }

    const records = await Attendance.find({ cohort_id: req.params.cohortId });
    const byDate = new Map();
    for (const r of records) {
      const key = r.date.toISOString().slice(0, 10);
      if (!byDate.has(key)) byDate.set(key, { date: key, present_count: 0, absent_count: 0 });
      const entry = byDate.get(key);
      if (r.status === 'present') entry.present_count += 1;
      else entry.absent_count += 1;
    }

    const sessions = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load attendance history', error: err.message });
  }
};

// GET /api/instructor/payouts — view-only, one row per cohort I teach, each
// including a paid/partial/pending count breakdown and the full per-student
// payment detail (amount owed, amount paid, balance remaining).
const listMyPayouts = async (req, res) => {
  try {
    const cohorts = await Cohort.find({ instructor_id: req.user._id });
    await Promise.all(cohorts.map(ensurePayoutForCohort));

    const payouts = await InstructorPayout.find({ instructor_id: req.user._id })
      .populate({ path: 'cohort_id', select: 'name course_id', populate: { path: 'course_id', select: 'title' } })
      .sort({ created_at: -1 });

    const withDetails = await Promise.all(payouts.map(async (payout) => {
      const cohortId = payout.cohort_id._id;
      const { breakdown, students } = await getCohortPaymentDetails(cohortId);
      const students_count = await Enrollment.countDocuments({ cohort_id: cohortId, status: 'active' });
      return { ...payout.toObject(), students_count, payment_breakdown: breakdown, student_payments: students };
    }));

    res.json({ payouts: withDetails });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your payouts', error: err.message });
  }
};

module.exports = {
  listMyCourses,
  getCourseContent,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  listMyCohorts,
  getDashboardStats,
  listCohortAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentSubmissions,
  gradeSubmission,
  getAttendanceRoster,
  saveAttendance,
  getAttendanceHistory,
  listMyPayouts,
};
