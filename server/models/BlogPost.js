const mongoose = require('mongoose');

const BLOG_STATUSES = ['draft', 'published'];

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image_url: { type: String, default: '' },
  status: { type: String, enum: BLOG_STATUSES, default: 'draft' },
  // Only set the first time a post transitions to 'published' — later edits
  // don't bump it, so its place in the public feed's sort order stays fixed.
  published_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
module.exports.BLOG_STATUSES = BLOG_STATUSES;
