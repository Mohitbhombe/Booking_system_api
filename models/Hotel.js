const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a hotel name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    address: {
      type: String,
      required: [true, 'Please add an address']
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Please add a country'],
      trim: true
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Please add price per night']
    },
    amenities: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0
    },
    totalRooms: {
      type: Number,
      required: [true, 'Please add total rooms']
    },
    availableRooms: {
      type: Number,
      required: [true, 'Please add available rooms']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Hotel', HotelSchema);
