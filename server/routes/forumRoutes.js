const express = require('express');
const { getAccess, listPosts, createPost, getPost, createReply } = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/access', getAccess);
router.get('/:forumType/posts', listPosts);
router.post('/:forumType/posts', createPost);
router.get('/:forumType/posts/:postId', getPost);
router.post('/:forumType/posts/:postId/replies', createReply);

module.exports = router;
