const MentorshipProgram = require('../models/MentorshipProgram');
const MentorshipRegistration = require('../models/MentorshipRegistration');

// GET /api/mentorship — public, open programs only
const listOpenPrograms = async (req, res) => {
  try {
    const programs = await MentorshipProgram.find({ status: 'open' }).sort({ created_at: -1 });
    res.json({ programs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load mentorship programs', error: err.message });
  }
};

// GET /api/mentorship/:id — public
const getProgram = async (req, res) => {
  try {
    const program = await MentorshipProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Mentorship program not found' });
    }
    res.json({ program });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load mentorship program', error: err.message });
  }
};

// POST /api/mentorship/:id/register — public
const registerForProgram = async (req, res) => {
  try {
    const program = await MentorshipProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Mentorship program not found' });
    }
    if (program.status !== 'open') {
      return res.status(400).json({ message: 'This mentorship program is no longer open for registration' });
    }

    const {
      full_name, email, phone,
      occupation_or_status, experience_level,
      reason_for_joining, how_heard_about_us,
    } = req.body;

    if (!full_name || !email || !phone || !occupation_or_status || !experience_level || !reason_for_joining) {
      return res.status(400).json({ message: 'Full name, email, phone, occupation/status, experience level, and reason for joining are required' });
    }

    const registration = await MentorshipRegistration.create({
      program_id: program._id,
      full_name,
      email,
      phone,
      occupation_or_status,
      experience_level,
      reason_for_joining,
      how_heard_about_us,
    });

    res.status(201).json({ registration });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit registration', error: err.message });
  }
};

module.exports = { listOpenPrograms, getProgram, registerForProgram };
