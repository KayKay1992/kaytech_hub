const crypto = require('crypto');
const InviteCode = require('../models/InviteCode');
const { logAction } = require('../utils/auditLog');

const INVITABLE_ROLES = ['student', 'instructor'];

const generateUniqueCode = async () => {
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    const exists = await InviteCode.findOne({ code });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique invite code — please try again');
};

// POST /api/invites — admin only
const createInvite = async (req, res) => {
  try {
    const { role } = req.body;
    if (!INVITABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role must be "student" or "instructor"' });
    }

    const code = await generateUniqueCode();
    const invite = await InviteCode.create({
      code,
      role,
      created_by: req.user._id,
    });

    await logAction({
      actor_id: req.user._id,
      action_type: 'invite_code.generated',
      target_type: 'InviteCode',
      target_id: invite._id,
      details: `Generated a ${role} invite code (${invite.code})`,
    });

    res.status(201).json({ invite });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate invite code', error: err.message });
  }
};

// GET /api/invites — admin only
const listInvites = async (req, res) => {
  try {
    const invites = await InviteCode.find()
      .sort({ created_at: -1 })
      .populate('created_by', 'name email')
      .populate('used_by', 'name email');

    const now = new Date();
    const withComputedState = invites.map((invite) => {
      const obj = invite.toObject();
      obj.is_expired = obj.status === 'unused' && obj.expires_at < now;
      return obj;
    });

    res.json({ invites: withComputedState });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load invite codes', error: err.message });
  }
};

// DELETE /api/invites/:id — admin only
const deleteInvite = async (req, res) => {
  try {
    const invite = await InviteCode.findByIdAndDelete(req.params.id);
    if (!invite) {
      return res.status(404).json({ message: 'Invite code not found' });
    }

    await logAction({
      actor_id: req.user._id,
      action_type: 'invite_code.deleted',
      target_type: 'InviteCode',
      target_id: invite._id,
      details: `Deleted ${invite.role} invite code (${invite.code})`,
    });

    res.json({ message: 'Invite code deleted', id: invite._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete invite code', error: err.message });
  }
};

module.exports = { createInvite, listInvites, deleteInvite };
