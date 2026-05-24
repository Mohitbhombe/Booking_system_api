const express = require('express');
const router = express.Router({ mergeParams: true });
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');
const { checkAvailability } = require('../controllers/bookingController');

// Public read routes
router.route('/:roomId/availability')
  .get(checkAvailability);

router.route('/')
  .get(getAllRooms)
  .post(protect, authorize('admin'), createRoom);

router.route('/:id')
  .get(getRoomById)
  .put(protect, authorize('admin'), updateRoom)
  .delete(protect, authorize('admin'), deleteRoom);

module.exports = router;
