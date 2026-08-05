const express = require('express');
const { listAuditLog, getAuditLogMeta } = require('../controllers/adminAuditLogController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

// Read-only by design — no POST/PATCH/DELETE. Audit entries are written
// only by internal logAction() calls at the action points themselves.
router.get('/audit-log', listAuditLog);
router.get('/audit-log/meta', getAuditLogMeta);

module.exports = router;
