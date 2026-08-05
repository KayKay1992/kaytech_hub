const Testimonial = require('../models/Testimonial');
const { logAction } = require('../utils/auditLog');

const STATUSES = ['pending', 'approved', 'rejected'];

// GET /api/admin/testimonials — every testimonial regardless of status
const listTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .populate('submitted_by_user_id', 'name email')
      .sort({ submitted_at: -1 });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load testimonials', error: err.message });
  }
};

// PATCH /api/admin/testimonials/:id — approve/reject and/or toggle featured
const updateTestimonial = async (req, res) => {
  try {
    const { status, featured } = req.body;
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    const statusChanged = status !== undefined && status !== testimonial.status;

    if (status !== undefined) testimonial.status = status;
    if (featured !== undefined) testimonial.featured = featured;
    if (testimonial.featured && testimonial.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved testimonials can be featured' });
    }
    if (status === 'approved' && !testimonial.published_at) {
      testimonial.published_at = new Date();
    }

    await testimonial.save();

    if (statusChanged && (status === 'approved' || status === 'rejected')) {
      await logAction({
        actor_id: req.user._id,
        action_type: status === 'approved' ? 'testimonial.approved' : 'testimonial.rejected',
        target_type: 'Testimonial',
        target_id: testimonial._id,
        details: `${status === 'approved' ? 'Approved' : 'Rejected'} testimonial from ${testimonial.name}`,
      });
    }

    res.json({ testimonial });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update testimonial', error: err.message });
  }
};

module.exports = { listTestimonials, updateTestimonial };
