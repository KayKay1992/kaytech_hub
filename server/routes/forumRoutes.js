const express = require('express');
const {
  getAccess,
  listPosts,
  createPost,
  getPost,
  createReply,
  getAlumniDirectory,
  sendAlumniMessage,
} = require('../controllers/forumController');
const { protect } = require('../middleware/auth');
const { alumniContactLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.use(protect);

router.get('/access', getAccess);
router.get('/alumni/directory', getAlumniDirectory);
router.post('/alumni/directory/:userId/message', alumniContactLimiter, sendAlumniMessage);
router.get('/:forumType/posts', listPosts);
router.post('/:forumType/posts', createPost);
router.get('/:forumType/posts/:postId', getPost);
router.post('/:forumType/posts/:postId/replies', createReply);

module.exports = router;
