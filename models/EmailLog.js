const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: [true, 'Recipient email is required']
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required']
    },
    type: {
      type: String,
      enum: {
        values: ['booking_confirmation', 'payment_receipt', 'cancellation', 'check_in_reminder'],
        message: 'Invalid email type'
      },
      required: true
    },
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['queued', 'sent', 'failed'],
        message: 'Status must be queued, sent, or failed'
      },
      default: 'queued'
    },
    attempts: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

EmailLogSchema.index({ type: 1, status: 1 });
EmailLogSchema.index({ booking: 1, type: 1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
