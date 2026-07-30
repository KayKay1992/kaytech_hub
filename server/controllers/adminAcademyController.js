const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const CourseRegistration = require('../models/CourseRegistration');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const COURSE_STATUSES = ['draft', 'published', 'archived'];
const COHORT_STATUSES = ['upcoming', 'active', 'completed'];
const REVIEW_ACTIONS = ['approve', 'reject'];
const REGISTRATION_STATUSES = ['new', 'contacted', 'confirmed', 'declined'];
const PAYMENT_STATUSES = ['pending', 'paid'];

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
};
