const SuccessStory = require('../models/SuccessStory');

// GET /api/success-stories — public, approved + featured only, for the Home
// page. Returns the whole featured pool (capped) rather than a fixed 4 —
// the Home page picks a random subset/order from it on every visit.
const listFeaturedStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find({ status: 'approved', featured: true })
      .populate('student_id', 'name')
      .populate('course_id', 'title')
      .sort({ published_at: -1 })
      .limit(20);
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load success stories', error: err.message });
  }
};

module.exports = { listFeaturedStories };
