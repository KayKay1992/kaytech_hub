const express = require('express');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { imageUploadMiddleware } = require('../utils/upload');
const { checkHoneypot } = require('../middleware/honeypot');
const { registerLimiter, forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/register', registerLimiter, imageUploadMiddleware.single('photo'), checkHoneypot(), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.patch('/profile', protect, imageUploadMiddleware.single('photo'), updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
