const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const DEFAULT_LIMIT = 50;

// GET /api/admin/audit-log?action_type=&actor_id=&from=&to=&page=&limit=
// Read-only — there is deliberately no create/update/delete endpoint here.
const listAuditLog = async (req, res) => {
  try {
    const { action_type, actor_id, from, to } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));

    const filter = {};
    if (action_type) filter.action_type = action_type;
    if (actor_id) filter.actor_id = actor_id;
    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.created_at.$lte = toDate;
      }
    }

    const [entries, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor_id', 'name email')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ entries, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load audit log', error: err.message });
  }
};

// GET /api/admin/audit-log/meta — distinct action types and actors, for filter dropdowns
const getAuditLogMeta = async (req, res) => {
  try {
    const [actionTypes, actors] = await Promise.all([
      AuditLog.distinct('action_type'),
      AuditLog.distinct('actor_id'),
    ]);
    const actorUsers = await User.find({ _id: { $in: actors } }, 'name email').sort({ name: 1 });
    res.json({ action_types: actionTypes.sort(), actors: actorUsers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load audit log filters', error: err.message });
  }
};

module.exports = { listAuditLog, getAuditLogMeta };
