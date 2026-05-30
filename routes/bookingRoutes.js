const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createBooking,
  getUserBookings,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  getAllBookings
} = require('../controllers/bookingController');

router.use(protect);

router.route('/me')
  .get(getMyBookings);

router.route('/user/:userId')
  .get(getUserBookings);

router.route('/:id/cancel')
  .put(cancelBooking);

router.route('/:id/status')
  .put(authorize('admin'), updateBookingStatus);

router.route('/')
  .post(createBooking)
  .get(authorize('admin'), getAllBookings);

router.route('/:id')
  .get(getBookingById);

module.exports = router;
