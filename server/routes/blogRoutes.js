const express = require('express');
const { listPublishedPosts, getPublishedPost } = require('../controllers/blogController');

const router = express.Router();

router.get('/', listPublishedPosts);
router.get('/:id', getPublishedPost);

module.exports = router;
