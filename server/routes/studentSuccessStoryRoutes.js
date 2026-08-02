const express = require('express');
const { submitStory } = require('../controllers/studentSuccessStoryController');
const { protect, authorize } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');

const router = express.Router();

router.use(protect, authorize('student'));

router.post('/success-stories', imageUploadMiddleware.single('photo'), submitStory);

module.exports = router;
