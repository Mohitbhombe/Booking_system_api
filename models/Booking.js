const mongoose = require('mongoose');

const GuestDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add guest name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add guest email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid guest email address'
      ]
    },
    phone: {
      type: String,
      trim: true,
      required: [true, 'Please add guest phone number']
    },
    guestCount: {
      type: Number,
      required: [true, 'Please specify number of guests'],
      min: [1, 'Guest count must be at least 1']
    }
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Please associate this booking with a user']
    },
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
      required: [true, 'Please associate this booking with a hotel']
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: [true, 'Please associate this booking with a room']
    },
    checkInDate: {
      type: Date,
      required: [true, 'Please add a check-in date']
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Please add a check-out date']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled'],
        message: 'Status must be pending, confirmed, or cancelled'
      },
      default: 'pending'
    },
    guestDetails: {
      type: GuestDetailsSchema,
      required: [true, 'Please provide guest details']
    },
    facilities: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient availability queries and preventing overlapping bookings
BookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
BookingSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
