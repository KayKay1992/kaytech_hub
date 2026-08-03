const BlogPost = require('../models/BlogPost');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const { BLOG_STATUSES } = BlogPost;

// GET /api/admin/blog — every post regardless of status
const listBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ created_at: -1 }).populate('author_id', 'name');
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load blog posts', error: err.message });
  }
};

// GET /api/admin/blog/:id
const getBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author_id', 'name');
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load blog post', error: err.message });
  }
};

// POST /api/admin/blog — cover image (field: image) is optional
const createBlogPost = async (req, res) => {
  try {
    const { title, content, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    if (status && !BLOG_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${BLOG_STATUSES.join(', ')}` });
    }

    let image_url = '';
    const coverFile = req.files?.image?.[0];
    if (coverFile) {
      const result = await uploadImage(coverFile, 'blog-images');
      image_url = result.url;
    }

    const finalStatus = status || 'draft';
    const post = await BlogPost.create({
      title,
      content,
      author_id: req.user._id,
      image_url,
      status: finalStatus,
      published_at: finalStatus === 'published' ? new Date() : null,
    });

    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create blog post', error: err.message });
  }
};

// PATCH /api/admin/blog/:id — handles edits and draft/published status changes
const updateBlogPost = async (req, res) => {
  try {
    const { title, content, status } = req.body;

    if (status && !BLOG_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${BLOG_STATUSES.join(', ')}` });
    }

    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (status !== undefined) {
      post.status = status;
      if (status === 'published' && !post.published_at) post.published_at = new Date();
    }

    const coverFile = req.files?.image?.[0];
    if (coverFile) {
      const oldKey = keyFromUrl(post.image_url);
      const result = await uploadImage(coverFile, 'blog-images');
      post.image_url = result.url;
      if (oldKey) deleteFile(oldKey).catch(() => {});
    }

    await post.save();
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update blog post', error: err.message });
  }
};

module.exports = { listBlogPosts, getBlogPost, createBlogPost, updateBlogPost };
