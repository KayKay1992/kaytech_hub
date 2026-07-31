const ScholarshipProgram = require('../models/ScholarshipProgram');
const ScholarshipApplication = require('../models/ScholarshipApplication');
const Course = require('../models/Course');

// GET /api/scholarships — public, open programs only
const listOpenPrograms = async (req, res) => {
  try {
    const programs = await ScholarshipProgram.find({ status: 'open' })
      .populate('course_id', 'title')
      .sort({ created_at: -1 });
    res.json({ programs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load scholarship programs', error: err.message });
  }
};

// GET /api/scholarships/:id — public
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

// POST /api/scholarships/:id/apply — public
const applyToProgram = async (req, res) => {
  try {
    const program = await ScholarshipProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Scholarship program not found' });
    }
    if (program.status !== 'open') {
      return res.status(400).json({ message: 'This scholarship program is no longer accepting applications' });
    }

    const { applicant_name, email, phone, course_id } = req.body;
    if (!applicant_name || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }
    if (!course_id) {
      return res.status(400).json({ message: 'Please select the course you are applying for' });
    }
    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(400).json({ message: 'course_id must reference an existing course' });
    }

    const application = await ScholarshipApplication.create({
      scholarship_program_id: program._id,
      applicant_name,
      email,
      phone,
      course_id,
    });

    res.status(201).json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit application', error: err.message });
  }
};

module.exports = { listOpenPrograms, getProgram, applyToProgram };
