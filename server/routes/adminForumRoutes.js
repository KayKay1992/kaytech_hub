const express = require('express');
const { listPosts, removePost, listReplies, removeReply } = require('../controllers/adminForumController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/forum-posts', listPosts);
router.patch('/forum-posts/:id/remove', removePost);
router.get('/forum-replies', listReplies);
router.patch('/forum-replies/:id/remove', removeReply);

module.exports = router;
