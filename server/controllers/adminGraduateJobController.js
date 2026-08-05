const GraduateJobListing = require('../models/GraduateJobListing');
const Notification = require('../models/Notification');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const { EMPLOYMENT_TYPES } = GraduateJobListing;
const STATUSES = ['open', 'closed'];

// GET /api/admin/graduate-jobs — admin only, every listing regardless of status
const listGraduateJobs = async (req, res) => {
  try {
    const jobs = await GraduateJobListing.find().sort({ posted_at: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load graduate job listings', error: err.message });
  }
};

// GET /api/admin/graduate-jobs/:id — admin only
const getGraduateJob = async (req, res) => {
  try {
    const job = await GraduateJobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load job listing', error: err.message });
  }
};

// POST /api/admin/graduate-jobs — admin only, optional company logo (field:
// image). Notifies every current Alumni Forum member (target_type:
// 'all_alumni') so they don't have to check the Job Board manually.
const createGraduateJob = async (req, res) => {
  try {
    const { company_name, job_title, job_description, location, employment_type, how_to_apply, status } = req.body;

    if (!company_name || !job_title || !job_description || !location || !employment_type || !how_to_apply) {
      return res.status(400).json({ message: 'Company name, job title, description, location, employment type, and how to apply are required' });
    }
    if (!EMPLOYMENT_TYPES.includes(employment_type)) {
      return res.status(400).json({ message: `Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}` });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    let company_logo_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'graduate-job-logos');
      company_logo_url = result.url;
    }

    const job = await GraduateJobListing.create({
      company_name,
      company_logo_url,
      job_title,
      job_description,
      location,
      employment_type,
      how_to_apply,
      status: status || 'open',
    });

    await Notification.create({
      sender_id: req.user._id,
      title: `New job opportunity: ${job_title} at ${company_name}`,
      message: `${company_name} is hiring for ${job_title} (${location}). Check the Job Board for details on how to apply.`,
      target_type: 'all_alumni',
    });

    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job listing', error: err.message });
  }
};

// PATCH /api/admin/graduate-jobs/:id — admin only. Handles edits, open/close
// status changes, and replacing the company logo.
const updateGraduateJob = async (req, res) => {
  try {
    const { company_name, job_title, job_description, location, employment_type, how_to_apply, status } = req.body;

    if (employment_type && !EMPLOYMENT_TYPES.includes(employment_type)) {
      return res.status(400).json({ message: `Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}` });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    const job = await GraduateJobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }

    if (company_name !== undefined) job.company_name = company_name;
    if (job_title !== undefined) job.job_title = job_title;
    if (job_description !== undefined) job.job_description = job_description;
    if (location !== undefined) job.location = location;
    if (employment_type !== undefined) job.employment_type = employment_type;
    if (how_to_apply !== undefined) job.how_to_apply = how_to_apply;
    if (status !== undefined) job.status = status;

    if (req.file) {
      const oldKey = keyFromUrl(job.company_logo_url);
      const result = await uploadImage(req.file, 'graduate-job-logos');
      job.company_logo_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await job.save();
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job listing', error: err.message });
  }
};

// DELETE /api/admin/graduate-jobs/:id — admin only. Restricted to closed
// (expired) listings so a live opening can't be removed without first going
// through the close step — deleting is for cleaning up old postings, not
// for taking one down.
const deleteGraduateJob = async (req, res) => {
  try {
    const job = await GraduateJobListing.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job listing not found' });
    }
    if (job.status !== 'closed') {
      return res.status(400).json({ message: 'Close this listing before deleting it' });
    }

    const logoKey = keyFromUrl(job.company_logo_url);
    await job.deleteOne();
    if (logoKey) deleteFile(logoKey).catch(() => {});

    res.json({ message: 'Job listing deleted', id: job._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job listing', error: err.message });
  }
};

module.exports = { listGraduateJobs, getGraduateJob, createGraduateJob, updateGraduateJob, deleteGraduateJob };
