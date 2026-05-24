const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  updatePassword
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/update-password', protect, updatePassword);

module.exports = router;
