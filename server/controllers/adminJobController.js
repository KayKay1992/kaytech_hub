const JobListing = require('../models/JobListing');
const JobApplication = require('../models/JobApplication');
const { getSignedFileUrl, keyFromUrl } = require('../utils/upload');

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'];

// GET /api/admin/jobs — admin only, every listing regardless of status
const listAllJobs = async (req, res) => {
  try {
    const jobs = await JobListing.find().sort({ posted_at: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load job listings', error: err.message });
  }
};

// GET /api/admin/jobs/:id — admin only
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

// POST /api/admin/jobs — admin only
const createJob = async (req, res) => {
  try {
    const { title, description, requirements, location, type } = req.body;
    if (!title || !description || !requirements || !location || !type) {
      return res.status(400).json({ message: 'Title, description, requirements, location, and type are required' });
    }
    if (!JOB_TYPES.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${JOB_TYPES.join(', ')}` });
    }

    const job = await JobListing.create({ title, description, requirements, location, type });
    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job listing', error: err.message });
  }
};

// PATCH /api/admin/jobs/:id — admin only. Handles edits and open/close status changes.
const updateJob = async (req, res) => {
  try {
    const { title, description, requirements, location, type, status } = req.body;

    if (type && !JOB_TYPES.includes(type)) {
      return res.status(400).json({ message: `Type must be one of: ${JOB_TYPES.join(', ')}` });
    }
    if (status && !['open', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "open" or "closed"' });
    }

    const job = await JobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }

    if (title !== undefined) job.title = title;
    if (description !== undefined) job.description = description;
    if (requirements !== undefined) job.requirements = requirements;
    if (location !== undefined) job.location = location;
    if (type !== undefined) job.type = type;
    if (status !== undefined) job.status = status;

    await job.save();
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job listing', error: err.message });
  }
};

// GET /api/admin/jobs/:id/applications — admin only
const listApplicationsForJob = async (req, res) => {
  try {
    const applications = await JobApplication.find({ job_id: req.params.id }).sort({ submitted_at: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load applications', error: err.message });
  }
};

// PATCH /api/admin/applications/:id — admin only
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update application status', error: err.message });
  }
};

// GET /api/admin/applications/:id/resume-url — admin only.
// Resumes aren't stored with public bucket access, so viewing one requires
// a short-lived signed URL generated on demand rather than a permanent link.
const getApplicationResumeUrl = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const key = keyFromUrl(application.resume_file_url);
    if (!key) {
      return res.status(500).json({ message: 'Could not resolve resume file location' });
    }

    const url = await getSignedFileUrl(key, 300);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate resume link', error: err.message });
  }
};

module.exports = {
  listAllJobs,
  getJob,
  createJob,
  updateJob,
  listApplicationsForJob,
  updateApplicationStatus,
  getApplicationResumeUrl,
};
