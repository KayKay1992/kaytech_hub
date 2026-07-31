const Enrollment = require('../models/Enrollment');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');

// GET /api/student/courses — every cohort I'm enrolled in, with live
// completion progress against that course's approved lessons
const listMyCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student_id: req.user._id })
      .populate({
        path: 'cohort_id',
        populate: [{ path: 'course_id' }, { path: 'instructor_id', select: 'name' }],
      })
      .sort({ enrolled_at: -1 });

    const withProgress = await Promise.all(enrollments.map(async (enrollment) => {
      const obj = enrollment.toObject();
      const courseId = enrollment.cohort_id?.course_id?._id;

      let totalLessons = 0;
      if (courseId) {
        const modules = await Module.find({ course_id: courseId, status: 'approved' }).select('_id');
        totalLessons = await Lesson.countDocuments({ module_id: { $in: modules.map((m) => m._id) }, status: 'approved' });
      }

      obj.total_lessons = totalLessons;
      obj.completed_count = enrollment.completed_lesson_ids.length;
      obj.progress_percent = totalLessons > 0 ? Math.round((enrollment.completed_lesson_ids.length / totalLessons) * 100) : 0;

      return obj;
    }));

    res.json({ enrollments: withProgress });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your courses', error: err.message });
  }
};

// GET /api/student/cohorts/:cohortId/content — approved module/lesson tree,
// only for cohorts I'm actively enrolled in
const getCohortContent = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student_id: req.user._id, cohort_id: req.params.cohortId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this cohort' });
    }

    const cohort = await Cohort.findById(req.params.cohortId)
      .populate('course_id')
      .populate('instructor_id', 'name');
    if (!cohort) {
      return res.status(404).json({ message: 'Cohort not found' });
    }

    const modules = await Module.find({ course_id: cohort.course_id._id, status: 'approved' }).sort({ order: 1, created_at: 1 });
    const lessons = await Lesson.find({ module_id: { $in: modules.map((m) => m._id) }, status: 'approved' }).sort({ order: 1, created_at: 1 });

    const completedIds = new Set(enrollment.completed_lesson_ids.map(String));
    const modulesWithLessons = modules.map((mod) => ({
      ...mod.toObject(),
      lessons: lessons
        .filter((lesson) => String(lesson.module_id) === String(mod._id))
        .map((lesson) => ({ ...lesson.toObject(), is_complete: completedIds.has(String(lesson._id)) })),
    }));

    res.json({ cohort, modules: modulesWithLessons, enrollment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load course content', error: err.message });
  }
};

// POST /api/student/cohorts/:cohortId/lessons/:lessonId/complete — toggle
const toggleLessonComplete = async (req, res) => {
  try {
    const { cohortId, lessonId } = req.params;

    const enrollment = await Enrollment.findOne({ student_id: req.user._id, cohort_id: cohortId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this cohort' });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, status: 'approved' });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const index = enrollment.completed_lesson_ids.findIndex((id) => String(id) === String(lessonId));
    let is_complete;
    if (index === -1) {
      enrollment.completed_lesson_ids.push(lessonId);
      is_complete = true;
    } else {
      enrollment.completed_lesson_ids.splice(index, 1);
      is_complete = false;
    }

    await enrollment.save();
    res.json({ is_complete });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update lesson progress', error: err.message });
  }
};

module.exports = { listMyCourses, getCohortContent, toggleLessonComplete };
