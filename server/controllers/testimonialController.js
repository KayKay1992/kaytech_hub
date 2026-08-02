const Testimonial = require('../models/Testimonial');
const { uploadImage } = require('../utils/upload');

// GET /api/testimonials — public, approved + featured only, for the Home
// page. Returns the whole featured pool (capped) rather than a fixed 4 —
// the Home page picks a random subset/order from it on every visit.
const listFeaturedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'approved', featured: true })
      .sort({ published_at: -1 })
      .limit(20);
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load testimonials', error: err.message });
  }
};

// POST /api/testimonials — public, no login required
const submitTestimonial = async (req, res) => {
  try {
    const { name, role_or_organization, message, rating } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: 'Name and message are required' });
    }
    if (rating !== undefined && rating !== '' && (Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    let photo_url = '';
    if (req.file) {
      const result = await uploadImage(req.file, 'testimonial-photos');
      photo_url = result.url;
    }

    const testimonial = await Testimonial.create({
      name,
      role_or_organization,
      message,
      rating: rating ? Number(rating) : null,
      photo_url,
      submitted_by_user_id: req.user?._id || null,
    });

    res.status(201).json({ testimonial });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit testimonial', error: err.message });
  }
};

module.exports = { listFeaturedTestimonials, submitTestimonial };
