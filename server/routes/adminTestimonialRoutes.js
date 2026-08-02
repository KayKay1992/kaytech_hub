const express = require('express');
const { listTestimonials, updateTestimonial } = require('../controllers/adminTestimonialController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/testimonials', listTestimonials);
router.patch('/testimonials/:id', updateTestimonial);

module.exports = router;
