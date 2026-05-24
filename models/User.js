const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a user name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['guest', 'admin'],
        message: 'Role must be either guest or admin'
      },
      default: 'guest'
    },
    phone: {
      type: String,
      trim: true
    },
    bookings: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Booking'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
