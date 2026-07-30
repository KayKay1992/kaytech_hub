const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const CourseRegistration = require('../models/CourseRegistration');

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

// GET /api/courses — public, published only
const listPublishedCourses = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { status: 'published' };
    if (category && category.trim()) {
      filter.category = new RegExp(category.trim(), 'i');
    }
    const courses = await Course.find(filter).sort({ created_at: -1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load courses', error: err.message });
  }
};

// GET /api/courses/:id — public, published only. Includes upcoming/active
// cohorts (with instructor name) so the detail page can show who's teaching.
const getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, status: 'published' });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const cohorts = await Cohort.find({ course_id: course._id, status: { $in: ['upcoming', 'active'] } })
      .populate('instructor_id', 'name')
      .sort({ start_date: 1 });

    // Approved-only curriculum outline (titles only — full lesson content
    // stays behind the future Enrollment-gated student view).
    const approvedModules = await Module.find({ course_id: course._id, status: 'approved' })
      .select('title order')
      .sort({ order: 1, created_at: 1 });
    const approvedLessons = await Lesson.find({ module_id: { $in: approvedModules.map((m) => m._id) }, status: 'approved' })
      .select('title order module_id')
      .sort({ order: 1, created_at: 1 });
    const modules = approvedModules.map((mod) => ({
      _id: mod._id,
      title: mod.title,
      lessons: approvedLessons.filter((lesson) => String(lesson.module_id) === String(mod._id)).map((l) => ({ _id: l._id, title: l.title })),
    }));

    res.json({ course, cohorts, modules });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load course', error: err.message });
  }
};

// POST /api/courses/:id/register — public, no login. Interest registration
// for a published course; admin follows up offline (see CourseRegistration).
const registerForCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, status: 'published' });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const { cohort_id, full_name, email, phone, occupation_status, experience_level, reason, how_heard } = req.body;
    if (!full_name || !email || !phone || !occupation_status || !experience_level || !reason) {
      return res.status(400).json({ message: 'Full name, email, phone, occupation/status, experience level, and reason are required' });
    }
    if (!EXPERIENCE_LEVELS.includes(experience_level)) {
      return res.status(400).json({ message: `Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}` });
    }

    if (cohort_id) {
      const cohort = await Cohort.findOne({ _id: cohort_id, course_id: course._id });
      if (!cohort) {
        return res.status(400).json({ message: 'cohort_id must reference a cohort of this course' });
      }
    }

    const registration = await CourseRegistration.create({
      course_id: course._id,
      cohort_id: cohort_id || undefined,
      full_name,
      email,
      phone,
      occupation_status,
      experience_level,
      reason,
      how_heard,
    });

    res.status(201).json({ registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit registration', error: err.message });
  }
};

module.exports = { listPublishedCourses, getCourse, registerForCourse };
