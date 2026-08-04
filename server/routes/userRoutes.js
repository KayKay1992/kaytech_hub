const express = require('express');
const { listUsers, updateUserRole, deleteUser, updateForumBan } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', listUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/forum-ban', updateForumBan);
router.delete('/:id', deleteUser);

module.exports = router;
