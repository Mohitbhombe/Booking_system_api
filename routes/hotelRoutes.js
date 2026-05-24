const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel
} = require('../controllers/hotelController');

// Re-route into other resource routers
const roomRouter = require('./roomRoutes');
router.use('/:hotelId/rooms', roomRouter);

// Public read routes
router.route('/')
  .get(getAllHotels)
  .post(protect, authorize('admin'), createHotel);

router.route('/:id')
  .get(getHotelById)
  .put(protect, authorize('admin'), updateHotel)
  .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;
