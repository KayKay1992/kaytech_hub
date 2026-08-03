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

const router = express.Router();

router.post('/register', imageUploadMiddleware.single('photo'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/profile', protect, imageUploadMiddleware.single('photo'), updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
