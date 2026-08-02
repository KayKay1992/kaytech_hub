const express = require('express');
const { listFeaturedTestimonials, submitTestimonial } = require('../controllers/testimonialController');
const { optionalAuth } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.get('/', listFeaturedTestimonials);
router.post('/', optionalAuth, imageUploadMiddleware.single('photo'), submitTestimonial);

module.exports = router;
