const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please add a room number'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Please add a room type'],
      enum: {
        values: ['Single', 'Double', 'Suite', 'Deluxe'],
        message: 'Please select a valid room type: Single, Double, Suite, or Deluxe'
      }
    },
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
      required: [true, 'Please associate this room with a hotel']
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please add a room price per night'],
      min: [0, 'Price cannot be negative']
    },
    capacity: {
      type: Number,
      required: [true, 'Please add room capacity (max guests)'],
      min: [1, 'Capacity must be at least 1']
    },
    amenities: {
      type: [String],
      default: []
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate room numbers within the same hotel
RoomSchema.index({ roomNumber: 1, hotel: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);
