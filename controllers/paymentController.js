const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const {
  toStripeCents,
  processRefund,
  handlePaymentSuccess,
  handlePaymentFailure
} = require('../utils/paymentService');
const { ForbiddenError } = require('../utils/errors');

// @desc    Create Stripe payment intent for a booking
// @route   POST /api/payments/create-intent
// @access  Public (Will protect in Week 6)
exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (!stripe) {
      throw new ValidationError('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
    }

    const { bookingId } = req.body;

    if (!bookingId) {
      throw new ValidationError('Please provide a bookingId');
    }

    const booking = await Booking.findById(bookingId).populate('user', 'name email');

    if (!booking) {
      throw new NotFoundError(`Booking not found with ID of ${bookingId}`);
    }

    if (booking.status === 'cancelled') {
      throw new ValidationError('Cannot pay for a cancelled booking');
    }

    if (booking.status === 'confirmed') {
      throw new ConflictError('Booking is already confirmed and paid');
    }

    if (
      req.user.role !== 'admin' &&
      booking.user._id?.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      throw new ForbiddenError('Not authorized to pay for this booking');
    }

    const existingPayment = await Payment.findOne({ booking: bookingId });

    if (existingPayment?.status === 'succeeded') {
      throw new ConflictError('Payment has already been completed for this booking');
    }

    if (existingPayment?.status === 'pending') {
      const existingIntent = await stripe.paymentIntents.retrieve(existingPayment.stripePaymentId);

      if (existingIntent.status === 'requires_payment_method' || existingIntent.status === 'requires_confirmation') {
        return res.status(200).json({
          success: true,
          data: {
            paymentId: existingPayment._id,
            clientSecret: existingIntent.client_secret,
            amount: existingPayment.amount,
            currency: 'usd'
          }
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeCents(booking.totalPrice),
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        userId: booking.user._id?.toString() || booking.user.toString(),
        hotelId: booking.hotel.toString()
      },
      automatic_payment_methods: { enabled: true }
    });

    let payment;

    if (existingPayment) {
      existingPayment.stripePaymentId = paymentIntent.id;
      existingPayment.amount = booking.totalPrice;
      existingPayment.status = 'pending';
      existingPayment.refundedAmount = 0;
      existingPayment.stripeRefundId = null;
      await existingPayment.save();
      payment = existingPayment;
    } else {
      payment = await Payment.create({
        booking: bookingId,
        amount: booking.totalPrice,
        stripePaymentId: paymentIntent.id,
        status: 'pending'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment._id,
        clientSecret: paymentIntent.client_secret,
        amount: payment.amount,
        currency: 'usd'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Stripe only
exports.stripeWebhook = async (req, res, next) => {
  if (!stripe) {
    return res.status(500).json({ success: false, error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ success: false, error: 'STRIPE_WEBHOOK_SECRET is not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Public (Will protect in Week 6)
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate({
      path: 'booking',
      populate: [
        { path: 'hotel', select: 'name city' },
        { path: 'room', select: 'roomNumber type' }
      ]
    });

    if (!payment) {
      throw new NotFoundError(`Payment not found with ID of ${req.params.id}`);
    }

    const bookingUserId = payment.booking?.user?.toString() || payment.booking?.user;
    if (
      req.user.role !== 'admin' &&
      bookingUserId !== req.user._id.toString()
    ) {
      throw new ForbiddenError('Not authorized to view this payment');
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment for a booking
// @route   GET /api/payments/booking/:bookingId
// @access  Public (Will protect in Week 6)
exports.getPaymentByBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      throw new NotFoundError(`Booking not found with ID of ${req.params.bookingId}`);
    }

    const payment = await Payment.findOne({ booking: req.params.bookingId });

    if (!payment) {
      throw new NotFoundError(`No payment found for booking ${req.params.bookingId}`);
    }

    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      throw new ForbiddenError('Not authorized to view this payment');
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund a payment (full or partial)
// @route   POST /api/payments/:id/refund
// @access  Public (Will restrict in Week 6)
exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      throw new NotFoundError(`Payment not found with ID of ${req.params.id}`);
    }

    const { amount } = req.body;
    const { payment: updatedPayment, refund } = await processRefund(payment, amount ?? null);

    const booking = await Booking.findById(updatedPayment.booking);
    if (booking && booking.status !== 'cancelled' && updatedPayment.status === 'refunded') {
      booking.status = 'cancelled';
      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: updatedPayment.status === 'refunded' ? 'Full refund processed' : 'Partial refund processed',
      data: {
        payment: updatedPayment,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment manually (dev/testing without webhook)
// @route   POST /api/payments/:id/confirm
// @access  Public (Dev only — remove or protect in production)
exports.confirmPaymentManually = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new ValidationError('Manual payment confirmation is disabled in production');
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      throw new NotFoundError(`Payment not found with ID of ${req.params.id}`);
    }

    if (payment.status === 'succeeded') {
      throw new ConflictError('Payment is already confirmed');
    }

    await handlePaymentSuccess({ id: payment.stripePaymentId, payment_method_types: ['card'] });

    const updatedPayment = await Payment.findById(payment._id);
    const booking = await Booking.findById(payment.booking);

    res.status(200).json({
      success: true,
      message: 'Payment confirmed manually (dev mode)',
      data: { payment: updatedPayment, booking }
    });
  } catch (error) {
    next(error);
  }
};
