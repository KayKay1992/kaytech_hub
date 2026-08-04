const mongoose = require('mongoose');

// A reply to a ForumPost. forum_type is not duplicated here — reach it via
// post_id when needed (e.g. admin moderation filtering by forum).
const forumReplySchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
  removed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  removed_at: { type: Date },
  removed_reason: { type: String, trim: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('ForumReply', forumReplySchema);
