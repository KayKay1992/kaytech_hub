const express = require('express');
const { listStories, updateStory } = require('../controllers/adminSuccessStoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/success-stories', listStories);
router.patch('/success-stories/:id', updateStory);

module.exports = router;
