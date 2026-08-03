const BlogPost = require('../models/BlogPost');

// GET /api/blog — public, published posts only
const listPublishedPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: 'published' }).sort({ published_at: -1 }).populate('author_id', 'name');
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load blog posts', error: err.message });
  }
};

// GET /api/blog/:id — public, only if published
const getPublishedPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author_id', 'name');
    if (!post || post.status !== 'published') {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load blog post', error: err.message });
  }
};

module.exports = { listPublishedPosts, getPublishedPost };
