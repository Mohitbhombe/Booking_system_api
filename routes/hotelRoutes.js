const express = require('express');
const router = express.Router();
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

// Routes mapped to controllers
router.route('/')
  .get(getAllHotels)
  .post(createHotel);

router.route('/:id')
  .get(getHotelById)
  .put(updateHotel)
  .delete(deleteHotel);

module.exports = router;
