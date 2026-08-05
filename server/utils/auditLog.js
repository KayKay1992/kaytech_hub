const AuditLog = require('../models/AuditLog');

// Records a sensitive admin action. Never throws — a logging failure must
// never roll back or block the action it's describing, so any error here is
// swallowed (and reported to the server console) rather than propagated.
const logAction = async ({ actor_id, action_type, target_type, target_id = null, details = '' }) => {
  try {
    await AuditLog.create({ actor_id, action_type, target_type, target_id, details });
  } catch (err) {
    console.error(`audit log failed: ${action_type} on ${target_type}:${target_id}`, err.message);
  }
};

module.exports = { logAction };
