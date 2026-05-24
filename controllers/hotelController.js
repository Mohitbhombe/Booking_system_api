const Hotel = require('../models/Hotel');

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Public (Will restrict in Week 6)
exports.createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    next(error);
  }
};

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
exports.getAllHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with id of ${req.params.id}`
      });
    }
    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    // Handle invalid ObjectId cast error
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: `Invalid hotel ID format: ${req.params.id}`
      });
    }
    next(error);
  }
};

// @desc    Update hotel by ID
// @route   PUT /api/hotels/:id
// @access  Public (Will restrict in Week 6)
exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with id of ${req.params.id}`
      });
    }
    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: `Invalid hotel ID format: ${req.params.id}`
      });
    }
    next(error);
  }
};

// @desc    Delete hotel by ID
// @route   DELETE /api/hotels/:id
// @access  Public (Will restrict in Week 6)
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with id of ${req.params.id}`
      });
    }
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: `Invalid hotel ID format: ${req.params.id}`
      });
    }
    next(error);
  }
};
