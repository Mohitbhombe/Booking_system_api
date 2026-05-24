const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      required: [true, 'Please associate this payment with a booking']
    },
    amount: {
      type: Number,
      required: [true, 'Please add payment amount'],
      min: [0, 'Amount cannot be negative']
    },
    stripePaymentId: {
      type: String,
      required: [true, 'Stripe payment intent ID is required']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
        message: 'Status must be pending, succeeded, failed, refunded, or partially_refunded'
      },
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      default: null
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refunded amount cannot be negative']
    },
    stripeRefundId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

PaymentSchema.index({ booking: 1 });
PaymentSchema.index({ stripePaymentId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', PaymentSchema);
