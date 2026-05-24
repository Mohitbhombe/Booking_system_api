const express = require('express');
const router = express.Router();
const {
  getEmailLogs,
  getEmailLogById,
  triggerReminders
} = require('../controllers/emailController');

router.get('/logs', getEmailLogs);
router.get('/logs/:id', getEmailLogById);
router.post('/send-reminders', triggerReminders);

module.exports = router;
