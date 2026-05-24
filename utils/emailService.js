const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const Booking = require('../models/Booking');
const emailQueue = require('./emailQueue');
const templates = require('./emailTemplates');

let transporter = null;

/**
 * Create or return the Nodemailer transporter.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
};

/**
 * Fetch a fully populated booking document.
 */
const getPopulatedBooking = (bookingId) =>
  Booking.findById(bookingId)
    .populate('user', 'name email')
    .populate('hotel', 'name city country address')
    .populate('room', 'roomNumber type pricePerNight');

/**
 * Core send function — creates log, sends email, updates log status.
 */
const sendEmail = async ({ to, subject, html, type, bookingId = null, metadata = {} }) => {
  const emailLog = await EmailLog.create({
    to,
    subject,
    type,
    booking: bookingId,
    status: 'queued',
    metadata
  });

  const transport = getTransporter();

  if (!transport) {
    emailLog.status = 'failed';
    emailLog.errorMessage = 'Email service not configured. Set EMAIL_HOST and EMAIL_USER in .env';
    emailLog.attempts = 1;
    await emailLog.save();
    console.warn(`Email not sent (not configured): ${type} → ${to}`);
    return emailLog;
  }

  try {
    emailLog.attempts += 1;

    await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });

    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    emailLog.errorMessage = null;
    await emailLog.save();

    console.log(`Email sent: ${type} → ${to}`);
    return emailLog;
  } catch (error) {
    emailLog.status = 'failed';
    emailLog.errorMessage = error.message;
    await emailLog.save();
    throw error;
  }
};

/**
 * Queue an email for async delivery with retry support.
 */
const queueEmail = (options) => {
  emailQueue.add(() => sendEmail(options));
};

/**
 * Send booking confirmation when a new booking is created.
 */
const sendBookingConfirmationEmail = async (booking) => {
  const populated = booking.hotel ? booking : await getPopulatedBooking(booking._id);
  if (!populated) return;

  const recipient = populated.guestDetails?.email || populated.user?.email;
  if (!recipient) return;

  const { subject, html } = templates.bookingConfirmation(populated);

  queueEmail({
    to: recipient,
    subject,
    html,
    type: 'booking_confirmation',
    bookingId: populated._id
  });
};

/**
 * Send payment receipt when payment succeeds.
 */
const sendPaymentReceiptEmail = async (bookingId, payment) => {
  const populated = await getPopulatedBooking(bookingId);
  if (!populated) return;

  const recipient = populated.guestDetails?.email || populated.user?.email;
  if (!recipient) return;

  const { subject, html } = templates.paymentReceipt(populated, payment);

  queueEmail({
    to: recipient,
    subject,
    html,
    type: 'payment_receipt',
    bookingId: populated._id,
    metadata: { paymentId: payment._id, amount: payment.amount }
  });
};

/**
 * Send cancellation notice with optional refund details.
 */
const sendCancellationEmail = async (booking, refundInfo = null) => {
  const populated = booking.hotel ? booking : await getPopulatedBooking(booking._id);
  if (!populated) return;

  const recipient = populated.guestDetails?.email || populated.user?.email;
  if (!recipient) return;

  const { subject, html } = templates.cancellation(populated, refundInfo);

  queueEmail({
    to: recipient,
    subject,
    html,
    type: 'cancellation',
    bookingId: populated._id,
    metadata: refundInfo ? { refundAmount: refundInfo.amount } : {}
  });
};

/**
 * Send check-in reminder (1 day before).
 */
const sendCheckInReminderEmail = async (booking) => {
  const populated = booking.hotel ? booking : await getPopulatedBooking(booking._id);
  if (!populated) return;

  const recipient = populated.guestDetails?.email || populated.user?.email;
  if (!recipient) return;

  const existingReminder = await EmailLog.findOne({
    booking: populated._id,
    type: 'check_in_reminder',
    status: 'sent'
  });

  if (existingReminder) return;

  const { subject, html } = templates.checkInReminder(populated);

  queueEmail({
    to: recipient,
    subject,
    html,
    type: 'check_in_reminder',
    bookingId: populated._id
  });
};

module.exports = {
  getTransporter,
  sendEmail,
  queueEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendCancellationEmail,
  sendCheckInReminderEmail,
  getPopulatedBooking
};
