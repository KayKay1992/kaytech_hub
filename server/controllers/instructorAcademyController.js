const Course = require('../models/Course');
const Cohort = require('../models/Cohort');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const { uploadFile } = require('../utils/upload');

// An instructor may only create/manage content for a course they're
// assigned to teach via at least one Cohort.
const isAssignedToCourse = (instructorId, courseId) =>
  Cohort.exists({ instructor_id: instructorId, course_id: courseId });

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

module.exports = {
  listMyCourses,
  getCourseContent,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
};
