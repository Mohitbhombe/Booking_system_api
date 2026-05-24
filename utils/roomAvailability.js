const Booking = require('../models/Booking');

/**
 * Calculate number of nights between check-in and check-out dates.
 * Uses UTC midnight to avoid timezone drift in day calculations.
 */
const calculateNights = (checkInDate, checkOutDate) => {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  checkIn.setUTCHours(0, 0, 0, 0);
  checkOut.setUTCHours(0, 0, 0, 0);

  const diffMs = checkOut.getTime() - checkIn.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
};

/**
 * Normalize a date to UTC midnight for consistent comparisons.
 */
const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Validate booking date rules:
 * - Check-in cannot be in the past
 * - Check-out must be after check-in
 * - Minimum stay of 1 night
 */
const validateBookingDates = (checkInDate, checkOutDate) => {
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);
  const today = normalizeDate(new Date());

  if (checkIn < today) {
    return { valid: false, message: 'Check-in date cannot be in the past' };
  }

  if (checkOut <= checkIn) {
    return { valid: false, message: 'Check-out date must be after check-in date' };
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights < 1) {
    return { valid: false, message: 'Booking must be for at least 1 night' };
  }

  return { valid: true, nights };
};

/**
 * Check if a room is available for the given date range.
 * A room is unavailable if any pending or confirmed booking overlaps.
 *
 * Overlap condition: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 */
const checkRoomAvailability = async (roomId, checkInDate, checkOutDate, excludeBookingId = null, session = null) => {
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);

  const query = {
    room: roomId,
    status: { $in: ['pending', 'confirmed'] },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const options = session ? { session } : {};
  const overlappingBooking = await Booking.findOne(query, null, options);

  return {
    available: !overlappingBooking,
    conflictingBooking: overlappingBooking
  };
};

/**
 * Calculate total price based on room rate and number of nights.
 */
const calculateTotalPrice = (pricePerNight, nights) => {
  return Math.round(pricePerNight * nights * 100) / 100;
};

module.exports = {
  calculateNights,
  normalizeDate,
  validateBookingDates,
  checkRoomAvailability,
  calculateTotalPrice
};
