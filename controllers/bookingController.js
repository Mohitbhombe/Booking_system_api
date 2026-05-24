const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const {
  validateBookingDates,
  checkRoomAvailability,
  calculateTotalPrice
} = require('../utils/roomAvailability');
const { processRefundForBooking } = require('../utils/paymentService');

/**
 * Core booking creation logic. Uses an optional MongoDB session when
 * transactions are supported (replica set / Atlas).
 */
const executeCreateBooking = async (body, session = null) => {
  const { user, hotel, room, checkInDate, checkOutDate, guestDetails } = body;

  if (!user || !hotel || !room || !checkInDate || !checkOutDate || !guestDetails) {
    throw new ValidationError('Please provide user, hotel, room, checkInDate, checkOutDate, and guestDetails');
  }

  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new ValidationError(dateValidation.message);
  }

  const sessionOpt = session ? { session } : {};

  const [userExists, hotelExists, roomExists] = await Promise.all([
    User.findById(user, null, sessionOpt),
    Hotel.findById(hotel, null, sessionOpt),
    Room.findById(room, null, sessionOpt)
  ]);

  if (!userExists) {
    throw new NotFoundError(`User not found with ID of ${user}`);
  }
  if (!hotelExists) {
    throw new NotFoundError(`Hotel not found with ID of ${hotel}`);
  }
  if (!roomExists) {
    throw new NotFoundError(`Room not found with ID of ${room}`);
  }

  if (roomExists.hotel.toString() !== hotel) {
    throw new ValidationError('Room does not belong to the specified hotel');
  }

  if (!roomExists.isAvailable) {
    throw new ConflictError('Room is currently unavailable for booking');
  }

  if (guestDetails.guestCount > roomExists.capacity) {
    throw new ValidationError(
      `Guest count (${guestDetails.guestCount}) exceeds room capacity (${roomExists.capacity})`
    );
  }

  const availability = await checkRoomAvailability(room, checkInDate, checkOutDate, null, session);
  if (!availability.available) {
    throw new ConflictError('Room is already booked for the selected dates');
  }

  const totalPrice = calculateTotalPrice(roomExists.pricePerNight, dateValidation.nights);

  const bookingData = {
    user,
    hotel,
    room,
    checkInDate,
    checkOutDate,
    totalPrice,
    guestDetails,
    status: 'pending'
  };

  const booking = session
    ? (await Booking.create([bookingData], { session }))[0]
    : await Booking.create(bookingData);

  await User.findByIdAndUpdate(user, { $push: { bookings: booking._id } }, sessionOpt);

  return booking;
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public (Will protect in Week 6)
exports.createBooking = async (req, res, next) => {
  try {
    let booking;

    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        booking = await executeCreateBooking(req.body, session);
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      // Local standalone MongoDB does not support transactions
      if (error.message && error.message.includes('replica set')) {
        booking = await executeCreateBooking(req.body);
      } else {
        throw error;
      }
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('hotel', 'name city country')
      .populate('room', 'roomNumber type pricePerNight capacity');

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for a user
// @route   GET /api/bookings/user/:userId
// @access  Public (Will protect in Week 6)
exports.getUserBookings = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new NotFoundError(`User not found with ID of ${req.params.userId}`);
    }

    const bookings = await Booking.find({ user: req.params.userId })
      .populate('hotel', 'name city country address')
      .populate('room', 'roomNumber type pricePerNight capacity')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Public (Will protect in Week 6)
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name city country address')
      .populate('room', 'roomNumber type pricePerNight capacity amenities');

    if (!booking) {
      throw new NotFoundError(`Booking not found with ID of ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Public (Will protect in Week 6)
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new NotFoundError(`Booking not found with ID of ${req.params.id}`);
    }

    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking is already cancelled');
    }

    let refundResult = null;
    try {
      refundResult = await processRefundForBooking(booking._id);
    } catch (refundError) {
      if (refundError.isOperational) {
        throw refundError;
      }
      console.error('Refund failed during cancellation:', refundError.message);
    }

    booking.status = 'cancelled';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('hotel', 'name city country')
      .populate('room', 'roomNumber type');

    res.status(200).json({
      success: true,
      message: refundResult
        ? 'Booking cancelled and refund processed successfully'
        : 'Booking cancelled successfully',
      refund: refundResult
        ? {
            amount: refundResult.refund.amount / 100,
            status: refundResult.refund.status
          }
        : null,
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Public (Will restrict to admin in Week 6)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      throw new ValidationError('Please provide a status value');
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new NotFoundError(`Booking not found with ID of ${req.params.id}`);
    }

    if (booking.status === 'cancelled' && status !== 'cancelled') {
      throw new ValidationError('Cannot change status of a cancelled booking');
    }

    if (status === 'confirmed' && booking.status !== 'confirmed') {
      const availability = await checkRoomAvailability(
        booking.room,
        booking.checkInDate,
        booking.checkOutDate,
        booking._id
      );

      if (!availability.available) {
        throw new ConflictError('Cannot confirm booking — room is no longer available for these dates');
      }
    }

    booking.status = status;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('hotel', 'name city country')
      .populate('room', 'roomNumber type');

    res.status(200).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check room availability for date range
// @route   GET /api/rooms/:roomId/availability
// @access  Public
exports.checkAvailability = async (req, res, next) => {
  try {
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate || !checkOutDate) {
      throw new ValidationError('Please provide checkInDate and checkOutDate query parameters');
    }

    const dateValidation = validateBookingDates(checkInDate, checkOutDate);
    if (!dateValidation.valid) {
      throw new ValidationError(dateValidation.message);
    }

    const room = await Room.findById(req.params.roomId);
    if (!room) {
      throw new NotFoundError(`Room not found with ID of ${req.params.roomId}`);
    }

    const availability = await checkRoomAvailability(room._id, checkInDate, checkOutDate);
    const totalPrice = calculateTotalPrice(room.pricePerNight, dateValidation.nights);

    res.status(200).json({
      success: true,
      data: {
        room: room._id,
        roomNumber: room.roomNumber,
        isAvailable: room.isAvailable && availability.available,
        checkInDate,
        checkOutDate,
        nights: dateValidation.nights,
        pricePerNight: room.pricePerNight,
        totalPrice
      }
    });
  } catch (error) {
    next(error);
  }
};
