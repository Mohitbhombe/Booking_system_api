const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createPaymentIntent,
  getPaymentById,
  getPaymentByBooking,
  refundPayment,
  confirmPaymentManually
} = require('../controllers/paymentController');

router.use(protect);

router.post('/create-intent', createPaymentIntent);

router.get('/booking/:bookingId', getPaymentByBooking);

router.post('/:id/refund', authorize('admin'), refundPayment);

router.post('/:id/confirm', confirmPaymentManually);

router.get('/:id', getPaymentById);

module.exports = router;
