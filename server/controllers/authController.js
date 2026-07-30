const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password, inviteCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // A valid, unused, non-expired invite code grants student/instructor.
    // No code, or an invalid/used/expired one, still creates the account —
    // just with no elevated permissions (same as a logged-out visitor).
    let role = 'member';
    let invite = null;

    if (inviteCode && inviteCode.trim()) {
      const match = await InviteCode.findOne({ code: inviteCode.trim().toUpperCase() });
      const isValid = match && match.status === 'unused' && match.expires_at > new Date();
      if (isValid) {
        invite = match;
        role = invite.role;
      }
    }

    const user = new User({ name, email, phone, role });
    user.password = password;
    await user.save();

    if (invite) {
      invite.status = 'used';
      invite.used_by = user._id;
      invite.used_at = new Date();
      await invite.save();
    }

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
