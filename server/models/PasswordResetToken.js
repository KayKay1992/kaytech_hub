const mongoose = require('mongoose');

// The raw token is emailed to the user and never stored — only its hash,
// so a leaked database can't be used to reset anyone's password.
const passwordResetTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token_hash: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
