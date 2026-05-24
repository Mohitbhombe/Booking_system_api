const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendCheckInReminderEmail } = require('./emailService');

/**
 * Find confirmed bookings checking in tomorrow and send reminder emails.
 */
const sendTomorrowCheckInReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const bookings = await Booking.find({
    status: 'confirmed',
    checkInDate: { $gte: tomorrow, $lt: dayAfter }
  })
    .populate('user', 'name email')
    .populate('hotel', 'name city country address')
    .populate('room', 'roomNumber type');

  console.log(`Reminder job: found ${bookings.length} booking(s) checking in tomorrow`);

  for (const booking of bookings) {
    try {
      await sendCheckInReminderEmail(booking);
    } catch (error) {
      console.error(`Failed to queue reminder for booking ${booking._id}:`, error.message);
    }
  }

  return bookings.length;
};

/**
 * Start the daily reminder cron job.
 * Runs every day at 9:00 AM server time.
 */
const startReminderScheduler = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily check-in reminder job...');
    try {
      await sendTomorrowCheckInReminders();
    } catch (error) {
      console.error('Reminder scheduler error:', error.message);
    }
  });

  console.log('Check-in reminder scheduler started (daily at 9:00 AM)');
};

module.exports = {
  sendTomorrowCheckInReminders,
  startReminderScheduler
};
