const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  context: { type: String, enum: ['student', 'instructor'], required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

// Every read of this history is scoped to one user's own context — this
// compound index keeps that lookup fast as chat history grows.
chatMessageSchema.index({ user_id: 1, context: 1, created_at: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
