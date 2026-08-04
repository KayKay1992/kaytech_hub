const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');

const FORUM_TYPES = ['student', 'alumni'];
const STATUSES = ['active', 'removed'];
const AUTHOR_FIELDS = 'name photo_url role';

// GET /api/admin/forum-posts?forum_type=&status=&search=
const listPosts = async (req, res) => {
  try {
    const { forum_type, status, search } = req.query;
    const filter = {};
    if (forum_type && FORUM_TYPES.includes(forum_type)) filter.forum_type = forum_type;
    if (status && STATUSES.includes(status)) filter.status = status;

    let posts = await ForumPost.find(filter)
      .sort({ created_at: -1 })
      .populate('author_id', AUTHOR_FIELDS)
      .populate('removed_by', 'name');

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      posts = posts.filter(
        (p) => p.content.toLowerCase().includes(q) || (p.author_id?.name || '').toLowerCase().includes(q)
      );
    }

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const reply_count = await ForumReply.countDocuments({ post_id: post._id });
        return { ...post.toObject(), reply_count };
      })
    );

    res.json({ posts: postsWithCounts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load posts', error: err.message });
  }
};

// PATCH /api/admin/forum-posts/:id/remove
const removePost = async (req, res) => {
  try {
    const reason = (req.body.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'A removal reason is required' });
    }

    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { status: 'removed', removed_by: req.user._id, removed_at: new Date(), removed_reason: reason },
      { new: true }
    ).populate('author_id', AUTHOR_FIELDS).populate('removed_by', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove post', error: err.message });
  }
};

// GET /api/admin/forum-replies?forum_type=&status=&search=
const listReplies = async (req, res) => {
  try {
    const { forum_type, status, search } = req.query;
    const filter = {};
    if (status && STATUSES.includes(status)) filter.status = status;

    let replies = await ForumReply.find(filter)
      .sort({ created_at: -1 })
      .populate('author_id', AUTHOR_FIELDS)
      .populate('removed_by', 'name')
      .populate('post_id', 'forum_type content');

    if (forum_type && FORUM_TYPES.includes(forum_type)) {
      replies = replies.filter((r) => r.post_id?.forum_type === forum_type);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      replies = replies.filter(
        (r) => r.content.toLowerCase().includes(q) || (r.author_id?.name || '').toLowerCase().includes(q)
      );
    }

    res.json({ replies });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load replies', error: err.message });
  }
};

// PATCH /api/admin/forum-replies/:id/remove
const removeReply = async (req, res) => {
  try {
    const reason = (req.body.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'A removal reason is required' });
    }

    const reply = await ForumReply.findByIdAndUpdate(
      req.params.id,
      { status: 'removed', removed_by: req.user._id, removed_at: new Date(), removed_reason: reason },
      { new: true }
    ).populate('author_id', AUTHOR_FIELDS).populate('removed_by', 'name').populate('post_id', 'forum_type content');

    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove reply', error: err.message });
  }
};

module.exports = { listPosts, removePost, listReplies, removeReply };
