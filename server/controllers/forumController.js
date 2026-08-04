const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const { getForumAccess } = require('../utils/forumAccess');

const FORUM_TYPES = ['student', 'alumni'];
const AUTHOR_FIELDS = 'name photo_url role';

const isValidForumType = (forumType) => FORUM_TYPES.includes(forumType);

// GET /api/forums/access — drives which forum links a student sees in the
// sidebar, and lets the client pre-empt a 403 with a friendly message.
const getAccess = async (req, res) => {
  try {
    const access = await getForumAccess(req.user);
    res.json(access);
  } catch (err) {
    res.status(500).json({ message: 'Failed to check forum access', error: err.message });
  }
};

// GET /api/forums/:forumType/posts
const listPosts = async (req, res) => {
  try {
    const { forumType } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const posts = await ForumPost.find({ forum_type: forumType, status: 'active' })
      .sort({ created_at: -1 })
      .populate('author_id', AUTHOR_FIELDS);

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const reply_count = await ForumReply.countDocuments({ post_id: post._id, status: 'active' });
        return { ...post.toObject(), reply_count };
      })
    );

    res.json({ posts: postsWithCounts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load posts', error: err.message });
  }
};

// POST /api/forums/:forumType/posts
const createPost = async (req, res) => {
  try {
    const { forumType } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await ForumPost.create({ forum_type: forumType, author_id: req.user._id, content });
    await post.populate('author_id', AUTHOR_FIELDS);

    res.status(201).json({ post: { ...post.toObject(), reply_count: 0 } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post', error: err.message });
  }
};

// GET /api/forums/:forumType/posts/:postId
const getPost = async (req, res) => {
  try {
    const { forumType, postId } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const post = await ForumPost.findOne({ _id: postId, forum_type: forumType, status: 'active' })
      .populate('author_id', AUTHOR_FIELDS);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const replies = await ForumReply.find({ post_id: post._id, status: 'active' })
      .sort({ created_at: 1 })
      .populate('author_id', AUTHOR_FIELDS);

    res.json({ post, replies });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load post', error: err.message });
  }
};

// POST /api/forums/:forumType/posts/:postId/replies
const createReply = async (req, res) => {
  try {
    const { forumType, postId } = req.params;
    if (!isValidForumType(forumType)) {
      return res.status(400).json({ message: `forumType must be one of: ${FORUM_TYPES.join(', ')}` });
    }

    const access = await getForumAccess(req.user);
    if (!access[forumType].allowed) {
      return res.status(403).json({ message: access[forumType].message });
    }

    const post = await ForumPost.findOne({ _id: postId, forum_type: forumType, status: 'active' });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const reply = await ForumReply.create({ post_id: post._id, author_id: req.user._id, content });
    await reply.populate('author_id', AUTHOR_FIELDS);

    res.status(201).json({ reply });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create reply', error: err.message });
  }
};

module.exports = { getAccess, listPosts, createPost, getPost, createReply };
