const ScholarshipProgram = require('../models/ScholarshipProgram');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const Course = require('../models/Course');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const PROGRAM_STATUSES = ['open', 'closed'];
const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];

// GET /api/admin/scholarships — admin only, every program regardless of status
const listPrograms = async (req, res) => {
  try {
    const programs = await ScholarshipProgram.find().populate('course_id', 'title').sort({ created_at: -1 });
    res.json({ programs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load scholarship programs', error: err.message });
  }
};

// GET /api/admin/scholarships/:id
const getProgram = async (req, res) => {
  try {
    const program = await ScholarshipProgram.findById(req.params.id).populate('course_id', 'title');
    if (!program) {
      return res.status(404).json({ message: 'Scholarship program not found' });
    }
    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load scholarship program', error: err.message });
  }
};

// POST /api/admin/scholarships — optional cover image (field: image)
const createProgram = async (req, res) => {
  try {
    const { title, description, requirements, course_id, status } = req.body;
    const applies_to_all_courses = req.body.applies_to_all_courses === 'true' || req.body.applies_to_all_courses === true;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    if (status && !PROGRAM_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PROGRAM_STATUSES.join(', ')}` });
    }
    if (!applies_to_all_courses && course_id) {
      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(400).json({ message: 'course_id must reference an existing course' });
      }
    }

    let image_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'scholarship-images');
      image_url = result.url;
    }

    const program = await ScholarshipProgram.create({
      title,
      description,
      requirements,
      course_id: applies_to_all_courses ? null : (course_id || null),
      applies_to_all_courses,
      image_url,
      status: status || 'open',
    });

    res.status(201).json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create scholarship program', error: err.message });
  }
};

// PATCH /api/admin/scholarships/:id — edit, change status, replace image
const updateProgram = async (req, res) => {
  try {
    const { title, description, requirements, course_id, status } = req.body;
    const applies_to_all_courses = req.body.applies_to_all_courses !== undefined
      ? (req.body.applies_to_all_courses === 'true' || req.body.applies_to_all_courses === true)
      : undefined;

    if (status && !PROGRAM_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${PROGRAM_STATUSES.join(', ')}` });
    }

    const program = await ScholarshipProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Scholarship program not found' });
    }

    if (applies_to_all_courses !== undefined) program.applies_to_all_courses = applies_to_all_courses;

    if (program.applies_to_all_courses) {
      program.course_id = null;
    } else if (course_id !== undefined) {
      if (course_id) {
        const course = await Course.findById(course_id);
        if (!course) {
          return res.status(400).json({ message: 'course_id must reference an existing course' });
        }
      }
      program.course_id = course_id || null;
    }
    if (title !== undefined) program.title = title;
    if (description !== undefined) program.description = description;
    if (requirements !== undefined) program.requirements = requirements;
    if (status !== undefined) program.status = status;

    if (req.file) {
      const oldKey = keyFromUrl(program.image_url);
      const result = await uploadImage(req.file, 'scholarship-images');
      program.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await program.save();
    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update scholarship program', error: err.message });
  }
};

// GET /api/admin/scholarships/:id/applications
const listApplicationsForProgram = async (req, res) => {
  try {
    const applications = await ScholarshipApplication.find({ scholarship_program_id: req.params.id })
      .populate('course_id', 'title')
      .populate('assigned_course_id', 'title')
      .sort({ submitted_at: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load applications', error: err.message });
  }
};

// PATCH /api/admin/scholarships/applications/:id — update status and/or assign a course
const updateApplication = async (req, res) => {
  try {
    const { status, assigned_course_id } = req.body;
    if (status && !APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}` });
    }

    const application = await ScholarshipApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (assigned_course_id !== undefined) {
      if (assigned_course_id) {
        const course = await Course.findById(assigned_course_id);
        if (!course) {
          return res.status(400).json({ message: 'assigned_course_id must reference an existing course' });
        }
      }
      application.assigned_course_id = assigned_course_id || null;
    }
    if (status !== undefined) application.status = status;

    await application.save();
    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update application', error: err.message });
  }
};

module.exports = {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  listApplicationsForProgram,
  updateApplication,
};
