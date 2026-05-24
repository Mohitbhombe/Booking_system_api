const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { ValidationError, NotFoundError, ConflictError } = require('./errors');
const { sendPaymentReceiptEmail } = require('./emailService');

/**
 * Convert dollar amount to Stripe cents (integer).
 */
const toStripeCents = (amount) => Math.round(amount * 100);

/**
 * Process a refund for a payment record.
 * @param {Object} payment - Mongoose Payment document
 * @param {number|null} refundAmount - Dollar amount to refund (null = full refund)
 */
const processRefund = async (payment, refundAmount = null) => {
  if (!stripe) {
    throw new ValidationError('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
  }

  if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
    throw new ValidationError(`Cannot refund payment with status: ${payment.status}`);
  }

  const alreadyRefunded = payment.refundedAmount || 0;
  const remaining = payment.amount - alreadyRefunded;

  if (remaining <= 0) {
    throw new ConflictError('Payment has already been fully refunded');
  }

  const amountToRefund = refundAmount !== null && refundAmount !== undefined
    ? refundAmount
    : remaining;

  if (amountToRefund <= 0) {
    throw new ValidationError('Refund amount must be greater than zero');
  }

  if (amountToRefund > remaining) {
    throw new ValidationError(
      `Refund amount ($${amountToRefund}) exceeds remaining balance ($${remaining})`
    );
  }

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentId,
    amount: toStripeCents(amountToRefund)
  });

  payment.refundedAmount = alreadyRefunded + amountToRefund;
  payment.stripeRefundId = refund.id;
  payment.status = payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded';
  await payment.save();

  return { payment, refund };
};

/**
 * Find and refund the successful payment linked to a booking.
 */
const processRefundForBooking = async (bookingId, refundAmount = null) => {
  const payment = await Payment.findOne({
    booking: bookingId,
    status: { $in: ['succeeded', 'partially_refunded'] }
  });

  if (!payment) {
    return null;
  }

  return processRefund(payment, refundAmount);
};

/**
 * Handle payment_intent.succeeded webhook event.
 */
const handlePaymentSuccess = async (paymentIntent) => {
  const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });

  if (!payment) {
    console.warn(`Payment record not found for intent: ${paymentIntent.id}`);
    return;
  }

  if (payment.status === 'succeeded') {
    return;
  }

  payment.status = 'succeeded';
  payment.paymentMethod = paymentIntent.payment_method_types?.[0] || 'card';
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  if (booking && booking.status === 'pending') {
    booking.status = 'confirmed';
    await booking.save();
  }

  sendPaymentReceiptEmail(payment.booking, payment).catch((err) =>
    console.error('Failed to queue payment receipt email:', err.message)
  );
};

/**
 * Handle payment_intent.payment_failed webhook event.
 */
const handlePaymentFailure = async (paymentIntent) => {
  const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });

  if (!payment) {
    console.warn(`Payment record not found for intent: ${paymentIntent.id}`);
    return;
  }

  if (payment.status === 'succeeded') {
    return;
  }

  payment.status = 'failed';
  await payment.save();
};

module.exports = {
  toStripeCents,
  processRefund,
  processRefundForBooking,
  handlePaymentSuccess,
  handlePaymentFailure
};
