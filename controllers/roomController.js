const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc    Create new room
// @route   POST /api/rooms
// @access  Public (Will restrict in Week 6)
exports.createRoom = async (req, res, next) => {
  try {
    const { hotel } = req.body;

    // Check if the associated hotel exists
    const hotelExists = await Hotel.findById(hotel);
    if (!hotelExists) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with ID of ${hotel}`
      });
    }

    const room = await Room.create(req.body);

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms (Optionally filter by hotel or type or availability)
// @route   GET /api/rooms
// @route   GET /api/hotels/:hotelId/rooms
// @access  Public
exports.getAllRooms = async (req, res, next) => {
  try {
    let query;

    // Support nested routing /api/hotels/:hotelId/rooms
    if (req.params.hotelId) {
      query = Room.find({ hotel: req.params.hotelId });
    } else if (req.query.hotel) {
      query = Room.find({ hotel: req.query.hotel });
    } else {
      query = Room.find();
    }

    // Basic filtering from query params
    const filterQuery = { ...req.query };
    // Exclude special fields
    const excludeFields = ['select', 'sort', 'page', 'limit', 'hotel'];
    excludeFields.forEach(param => delete filterQuery[param]);

    query = query.find(filterQuery).populate({
      path: 'hotel',
      select: 'name city country'
    });

    const rooms = await query;

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate({
      path: 'hotel',
      select: 'name city country'
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: `Room not found with ID of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room by ID
// @route   PUT /api/rooms/:id
// @access  Public (Will restrict in Week 6)
exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: `Room not found with ID of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room by ID
// @route   DELETE /api/rooms/:id
// @access  Public (Will restrict in Week 6)
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: `Room not found with ID of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
