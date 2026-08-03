const express = require('express');
const { listFeaturedTestimonials, submitTestimonial } = require('../controllers/testimonialController');
const { optionalAuth } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');
const { checkHoneypot } = require('../middleware/honeypot');
const { standardFormLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/', listFeaturedTestimonials);
router.post('/', standardFormLimiter, optionalAuth, imageUploadMiddleware.single('photo'), checkHoneypot(), submitTestimonial);

module.exports = router;
