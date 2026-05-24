const EmailLog = require('../models/EmailLog');
const { sendTomorrowCheckInReminders } = require('../utils/reminderScheduler');
const { ValidationError } = require('../utils/errors');

// @desc    Get all email logs
// @route   GET /api/emails/logs
// @access  Public (Will restrict to admin in Week 6)
exports.getEmailLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.booking) filter.booking = req.query.booking;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .populate('booking', 'checkInDate checkOutDate status')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      EmailLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single email log by ID
// @route   GET /api/emails/logs/:id
// @access  Public (Will restrict to admin in Week 6)
exports.getEmailLogById = async (req, res, next) => {
  try {
    const log = await EmailLog.findById(req.params.id).populate('booking');

    if (!log) {
      return res.status(404).json({ success: false, error: 'Email log not found' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually trigger check-in reminders (dev/testing)
// @route   POST /api/emails/send-reminders
// @access  Public (Dev only)
exports.triggerReminders = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ValidationError('Manual reminder trigger is disabled in production');
    }

    const count = await sendTomorrowCheckInReminders();

    res.status(200).json({
      success: true,
      message: `Queued reminder emails for ${count} booking(s) checking in tomorrow`
    });
  } catch (error) {
    next(error);
  }
};
