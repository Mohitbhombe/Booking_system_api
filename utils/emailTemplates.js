/**
 * HTML email templates for hotel booking notifications.
 */

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Booking</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">Hotel Booking System</h1>
              <p style="margin:8px 0 0;color:#e3f2fd;font-size:14px;">Your trusted travel companion</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8f9fa;padding:20px 32px;border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#6c757d;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} Hotel Booking System. All rights reserved.<br>
                This is an automated message — please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

const bookingDetailsBlock = (booking) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0;">
    <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Hotel:</strong> ${booking.hotel.name}</td></tr>
    <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Location:</strong> ${booking.hotel.city}, ${booking.hotel.country}</td></tr>
    <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Room:</strong> ${booking.room.roomNumber} (${booking.room.type})</td></tr>
    <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Check-in:</strong> ${formatDate(booking.checkInDate)}</td></tr>
    <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Check-out:</strong> ${formatDate(booking.checkOutDate)}</td></tr>
    <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Guests:</strong> ${booking.guestDetails.guestCount}</td></tr>
    <tr><td style="padding:8px 16px;color:#1a73e8;font-size:16px;"><strong>Total:</strong> $${booking.totalPrice.toFixed(2)}</td></tr>
  </table>`;

exports.bookingConfirmation = (booking) => {
  const guestName = booking.guestDetails?.name || booking.user?.name || 'Guest';
  const content = `
    <h2 style="margin:0 0 8px;color:#212529;">Booking Received!</h2>
    <p style="color:#495057;font-size:15px;line-height:1.6;">
      Hi ${guestName}, thank you for your booking. Your reservation has been created and is
      <strong style="color:#f59e0b;">pending payment</strong>.
    </p>
  <p style="color:#495057;font-size:15px;line-height:1.6;">
      Please complete your payment to confirm your reservation.
    </p>
    ${bookingDetailsBlock(booking)}
    <p style="color:#6c757d;font-size:13px;">Booking Reference: <strong>${booking._id}</strong></p>`;

  return {
    subject: `Booking Received — ${booking.hotel.name}`,
    html: baseLayout(content)
  };
};

exports.paymentReceipt = (booking, payment) => {
  const guestName = booking.guestDetails?.name || booking.user?.name || 'Guest';
  const content = `
    <h2 style="margin:0 0 8px;color:#212529;">Payment Confirmed!</h2>
    <p style="color:#495057;font-size:15px;line-height:1.6;">
      Hi ${guestName}, your payment has been successfully processed and your booking is now
      <strong style="color:#28a745;">confirmed</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-radius:6px;padding:16px;margin:16px 0;">
      <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Amount Paid:</strong> $${payment.amount.toFixed(2)}</td></tr>
      <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Payment Method:</strong> ${payment.paymentMethod || 'card'}</td></tr>
      <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Transaction ID:</strong> ${payment.stripePaymentId}</td></tr>
      <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Status:</strong> <span style="color:#28a745;">Paid</span></td></tr>
    </table>
    ${bookingDetailsBlock(booking)}
    <p style="color:#6c757d;font-size:13px;">Booking Reference: <strong>${booking._id}</strong></p>`;

  return {
    subject: `Payment Receipt — ${booking.hotel.name}`,
    html: baseLayout(content)
  };
};

exports.cancellation = (booking, refundInfo = null) => {
  const guestName = booking.guestDetails?.name || booking.user?.name || 'Guest';
  const refundBlock = refundInfo
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd;border-radius:6px;padding:16px;margin:16px 0;">
        <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Refund Amount:</strong> $${refundInfo.amount.toFixed(2)}</td></tr>
        <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Refund Status:</strong> ${refundInfo.status}</td></tr>
        <tr><td style="padding:8px 16px;color:#856404;font-size:13px;">Your refund will appear in your account within 5–10 business days.</td></tr>
      </table>`
    : `<p style="color:#6c757d;font-size:14px;">No payment was processed for this booking, so no refund is applicable.</p>`;

  const content = `
    <h2 style="margin:0 0 8px;color:#212529;">Booking Cancelled</h2>
    <p style="color:#495057;font-size:15px;line-height:1.6;">
      Hi ${guestName}, your booking at <strong>${booking.hotel.name}</strong> has been cancelled as requested.
    </p>
    ${bookingDetailsBlock(booking)}
    <h3 style="color:#495057;font-size:16px;margin-top:24px;">Refund Details</h3>
    ${refundBlock}
    <p style="color:#6c757d;font-size:13px;">Booking Reference: <strong>${booking._id}</strong></p>`;

  return {
    subject: `Booking Cancelled — ${booking.hotel.name}`,
    html: baseLayout(content)
  };
};

exports.checkInReminder = (booking) => {
  const guestName = booking.guestDetails?.name || booking.user?.name || 'Guest';
  const content = `
    <h2 style="margin:0 0 8px;color:#212529;">Check-in Tomorrow!</h2>
    <p style="color:#495057;font-size:15px;line-height:1.6;">
      Hi ${guestName}, this is a friendly reminder that your check-in at
      <strong>${booking.hotel.name}</strong> is <strong>tomorrow</strong>.
    </p>
    ${bookingDetailsBlock(booking)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e3f2fd;border-radius:6px;padding:16px;margin:16px 0;">
      <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Address:</strong> ${booking.hotel.address || 'See hotel website'}</td></tr>
      <tr><td style="padding:8px 16px;color:#495057;font-size:14px;"><strong>Check-in Time:</strong> From 3:00 PM</td></tr>
    </table>
    <p style="color:#495057;font-size:15px;">We look forward to welcoming you. Safe travels!</p>
    <p style="color:#6c757d;font-size:13px;">Booking Reference: <strong>${booking._id}</strong></p>`;

  return {
    subject: `Reminder: Check-in Tomorrow at ${booking.hotel.name}`,
    html: baseLayout(content)
  };
};

exports.formatDate = formatDate;
