const User = require('../models/User');

const VALID_ROLES = ['student', 'instructor', 'admin', 'member'];

// GET /api/users?role=student&search=jane — admin only
const listUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && VALID_ROLES.includes(role)) {
      filter.role = role;
    }

    if (search && search.trim()) {
      const pattern = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }];
    }

    const users = await User.find(filter).sort({ created_at: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users', error: err.message });
  }
};

// PATCH /api/users/:id/role — admin only
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
};

// DELETE /api/users/:id — admin only
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Foundation only — no Enrollment/Attendance/Cohort records exist yet.
    // Once Academy is built, deleting a student/instructor here will need
    // to decide what happens to their enrollments, attendance history, and
    // cohort assignments (cascade delete vs. anonymize vs. block deletion).
    // Not handled yet — flagged for that module.
    res.json({ message: 'User deleted', id: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

module.exports = { listUsers, updateUserRole, deleteUser };
