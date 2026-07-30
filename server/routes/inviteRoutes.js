const express = require('express');
const { createInvite, listInvites, deleteInvite } = require('../controllers/inviteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.post('/', createInvite);
router.get('/', listInvites);
router.delete('/:id', deleteInvite);

module.exports = router;
