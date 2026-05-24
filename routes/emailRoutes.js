const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getEmailLogs,
  getEmailLogById,
  triggerReminders
} = require('../controllers/emailController');

router.use(protect, authorize('admin'));

router.get('/logs', getEmailLogs);
router.get('/logs/:id', getEmailLogById);
router.post('/send-reminders', triggerReminders);

module.exports = router;
