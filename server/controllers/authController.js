const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../utils/email');
const { uploadImage, deleteFile, keyFromUrl } = require('../utils/upload');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

    if (req.file) {
      const { url } = await uploadImage(req.file, 'profile-photos');
      user.photo_url = url;
    }

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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Same response whether or not the email is registered — never reveal
    // account existence through this endpoint.
    const genericResponse = { message: "If an account exists with that email, we've sent a reset link." };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Only one live reset link per account at a time.
    await PasswordResetToken.deleteMany({ user_id: user._id });
    await PasswordResetToken.create({
      user_id: user._id,
      token_hash,
      expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.', error: err.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const token_hash = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await PasswordResetToken.findOne({ token_hash });

    const invalidMessage = 'This reset link is invalid or has expired. Please request a new one.';

    if (!resetToken || resetToken.expires_at < new Date()) {
      if (resetToken) await resetToken.deleteOne();
      return res.status(400).json({ message: invalidMessage });
    }

    const user = await User.findById(resetToken.user_id);
    if (!user) {
      await resetToken.deleteOne();
      return res.status(400).json({ message: invalidMessage });
    }

    user.password = password;
    await user.save();
    await resetToken.deleteOne();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong. Please try again.', error: err.message });
  }
};

// PATCH /api/auth/profile — any logged-in user updating their own info.
const updateProfile = async (req, res) => {
  try {
    const { name, phone, email, current_role, current_company, alumni_bio, show_in_alumni_directory } = req.body;
    const user = req.user;

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: 'This email is already in use by another account' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    // Alumni Directory opt-in fields — harmless to accept from any account
    // (only ever surfaced in the UI to qualifying alumni); actual directory
    // visibility is re-checked against live Certificate records on read.
    if (current_role !== undefined) user.current_role = current_role.trim();
    if (current_company !== undefined) user.current_company = current_company.trim();
    if (alumni_bio !== undefined) user.alumni_bio = alumni_bio.trim().slice(0, 600);
    if (show_in_alumni_directory !== undefined) {
      user.show_in_alumni_directory = show_in_alumni_directory === true || show_in_alumni_directory === 'true';
    }

    if (req.file) {
      const oldKey = keyFromUrl(user.photo_url);
      const { url } = await uploadImage(req.file, 'profile-photos');
      user.photo_url = url;
      if (oldKey) await deleteFile(oldKey).catch(() => {});
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// PATCH /api/auth/change-password — requires the current password.
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};
