const mongoose = require('mongoose');

// A top-level post in either the Student Forum or Alumni Forum. Membership
// (who can read/write) is never stored here — it's computed live from
// Enrollment/Certificate records, see utils/forumAccess.js.
const forumPostSchema = new mongoose.Schema({
  forum_type: { type: String, enum: ['student', 'alumni'], required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
  removed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  removed_at: { type: Date },
  removed_reason: { type: String, trim: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
