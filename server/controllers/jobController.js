const JobListing = require('../models/JobListing');
const JobApplication = require('../models/JobApplication');
const { uploadFile } = require('../utils/upload');

// GET /api/jobs — public, open listings only
const listOpenJobs = async (req, res) => {
  try {
    const jobs = await JobListing.find({ status: 'open' }).sort({ posted_at: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load job listings', error: err.message });
  }
};

// GET /api/jobs/:id — public
const getJob = async (req, res) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load job listing', error: err.message });
  }
};

// POST /api/jobs/:id/apply — public, resume upload required (PDF only)
const applyToJob = async (req, res) => {
  try {
    const job = await JobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This listing is no longer accepting applications' });
    }

    const { full_name, email, phone, cover_note } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'A resume file is required' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Resume must be a PDF file' });
    }

    const { url } = await uploadFile(req.file, 'resumes');

    const application = await JobApplication.create({
      job_id: job._id,
      full_name,
      email,
      phone,
      cover_note,
      resume_file_url: url,
    });

    res.status(201).json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit application', error: err.message });
  }
};

module.exports = { listOpenJobs, getJob, applyToJob };
