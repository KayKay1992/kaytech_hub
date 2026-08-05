const GraduateJobListing = require('../models/GraduateJobListing');
const { getForumAccess } = require('../utils/forumAccess');

// GET /api/graduate-jobs — Job Board, open listings only. Same access rule
// as the Alumni Forum/Directory (live Certificate check, never cached).
const listOpenGraduateJobs = async (req, res) => {
  try {
    const access = await getForumAccess(req.user);
    if (!access.alumni.allowed) {
      return res.status(403).json({ message: access.alumni.message });
    }

    const jobs = await GraduateJobListing.find({ status: 'open' }).sort({ posted_at: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load the job board', error: err.message });
  }
};

module.exports = { listOpenGraduateJobs };
