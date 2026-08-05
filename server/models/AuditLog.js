const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action_type: {
    type: String,
    required: true,
    trim: true,
  },
  target_type: {
    type: String,
    required: true,
    trim: true,
  },
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  details: {
    type: String,
    default: '',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

auditLogSchema.index({ created_at: -1 });
auditLogSchema.index({ action_type: 1 });
auditLogSchema.index({ actor_id: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
