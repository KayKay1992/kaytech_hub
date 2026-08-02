const express = require('express');
const { listFeaturedStories } = require('../controllers/successStoryController');

const router = express.Router();

router.get('/', listFeaturedStories);

module.exports = router;
