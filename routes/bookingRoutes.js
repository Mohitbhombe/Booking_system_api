const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');

router.route('/user/:userId')
  .get(getUserBookings);

router.route('/:id/cancel')
  .put(cancelBooking);

router.route('/:id/status')
  .put(updateBookingStatus);

router.route('/')
  .post(createBooking);

router.route('/:id')
  .get(getBookingById);

module.exports = router;
