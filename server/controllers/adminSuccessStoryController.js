const SuccessStory = require('../models/SuccessStory');
const { logAction } = require('../utils/auditLog');

const STATUSES = ['pending', 'approved', 'rejected'];

// GET /api/admin/success-stories — every story regardless of status
const listStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find()
      .populate('student_id', 'name email')
      .populate('course_id', 'title')
      .sort({ submitted_at: -1 });
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load success stories', error: err.message });
  }
};

// PATCH /api/admin/success-stories/:id — approve/reject and/or toggle featured
const updateStory = async (req, res) => {
  try {
    const { status, featured } = req.body;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    const story = await SuccessStory.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: 'Success story not found' });
    }
    const statusChanged = status !== undefined && status !== story.status;

    if (status !== undefined) story.status = status;
    if (featured !== undefined) story.featured = featured;
    if (story.featured && story.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved stories can be featured' });
    }
    if (status === 'approved' && !story.published_at) {
      story.published_at = new Date();
    }

    await story.save();

    if (statusChanged && (status === 'approved' || status === 'rejected')) {
      await logAction({
        actor_id: req.user._id,
        action_type: status === 'approved' ? 'success_story.approved' : 'success_story.rejected',
        target_type: 'SuccessStory',
        target_id: story._id,
        details: `${status === 'approved' ? 'Approved' : 'Rejected'} success story "${story.headline}"`,
      });
    }

    res.json({ story });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update success story', error: err.message });
  }
};

module.exports = { listStories, updateStory };
