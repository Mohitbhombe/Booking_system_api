const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentById,
  getPaymentByBooking,
  refundPayment,
  confirmPaymentManually
} = require('../controllers/paymentController');

router.post('/create-intent', createPaymentIntent);

router.get('/booking/:bookingId', getPaymentByBooking);

router.post('/:id/refund', refundPayment);

router.post('/:id/confirm', confirmPaymentManually);

router.get('/:id', getPaymentById);

module.exports = router;
